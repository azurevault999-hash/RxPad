#!/usr/bin/env python3
"""Build the bundled local CDCI catalogue from the supplied NRCeS TSV package."""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import os
import sqlite3
import zipfile
from pathlib import Path
from typing import Iterable


PACKAGE_ROOT = "CommonDrugCodesForIndia_FlatFilePackage"
MASTER_FILES = {
    "brands": "BrandMaster.txt",
    "products": "ProductMaster.txt",
    "generics": "GenericMaster.txt",
    "substances": "SubstanceMaster.txt",
    "suppliers": "SupplierMaster.txt",
    "drug_forms": "DrugFormMaster.txt",
    "routes": "RouteOfAdministrationMaster.txt",
}


def clean_row(row: dict[str | None, str]) -> dict[str, str]:
    return {
        key.strip(): (value or "").strip()
        for key, value in row.items()
        if key is not None
    }


def read_tsv(archive: zipfile.ZipFile, filename: str) -> list[dict[str, str]]:
    member = f"{PACKAGE_ROOT}/{filename}"
    with archive.open(member) as raw:
        text = io.TextIOWrapper(raw, encoding="utf-8-sig", newline="")
        return [clean_row(row) for row in csv.DictReader(text, delimiter="\t")]


def split_identifiers(value: str) -> list[str]:
    return [part.strip() for part in value.split("+") if part.strip()]


def chunks(items: Iterable[tuple], size: int = 1000) -> Iterable[list[tuple]]:
    batch: list[tuple] = []
    for item in items:
        batch.append(item)
        if len(batch) == size:
            yield batch
            batch = []
    if batch:
        yield batch


def add_metadata(connection: sqlite3.Connection, key: str, value: str) -> None:
    connection.execute(
        "INSERT INTO catalog_metadata (key, value) VALUES (?, ?)",
        (key, value),
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("package", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    args.output.parent.mkdir(parents=True, exist_ok=True)
    if args.output.exists():
        args.output.unlink()

    source_sha256 = hashlib.sha256(args.package.read_bytes()).hexdigest()
    with zipfile.ZipFile(args.package) as archive:
        data = {
            key: read_tsv(archive, filename)
            for key, filename in MASTER_FILES.items()
        }
        license_text = archive.read(f"{PACKAGE_ROOT}/License.txt").decode("utf-8-sig")

    products_by_id = {row["Identifier"]: row for row in data["products"]}
    generics_by_id = {row["Identifier"]: row for row in data["generics"]}
    substances_by_id = {row["Identifier"]: row for row in data["substances"]}
    suppliers_by_id = {row["Identifier"]: row for row in data["suppliers"]}
    forms_by_id = {row["Id"]: row for row in data["drug_forms"]}
    routes_by_id = {row["Identifier"]: row for row in data["routes"]}

    connection = sqlite3.connect(args.output)
    connection.executescript(
        """
        PRAGMA journal_mode = OFF;
        PRAGMA synchronous = OFF;
        PRAGMA temp_store = MEMORY;
        PRAGMA foreign_keys = OFF;
        PRAGMA user_version = 1;

        CREATE TABLE catalog_metadata (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );

        CREATE TABLE brand_master (
          identifier TEXT PRIMARY KEY NOT NULL,
          brand_name TEXT NOT NULL,
          product_identifier TEXT,
          supplier_identifier TEXT,
          generic_identifier TEXT,
          license_number TEXT,
          license_status TEXT,
          excipient TEXT,
          last_updated_on TEXT
        );

        CREATE TABLE product_master (
          identifier TEXT PRIMARY KEY NOT NULL,
          product_name TEXT NOT NULL
        );

        CREATE TABLE generic_master (
          identifier TEXT PRIMARY KEY NOT NULL,
          generic_name TEXT NOT NULL,
          therapeutic_role TEXT,
          indication TEXT,
          contra_indication TEXT,
          interaction_with_drugs TEXT,
          classification_of_drugs TEXT,
          source_regulatory TEXT,
          last_updated_on TEXT
        );

        CREATE TABLE substance_master (
          identifier TEXT PRIMARY KEY NOT NULL,
          substance_name TEXT NOT NULL,
          cas_number TEXT,
          unii TEXT,
          substance_description TEXT,
          molecular_weight TEXT,
          toxicity TEXT,
          smile TEXT,
          inchi TEXT,
          iupac_name TEXT,
          molecular_formula TEXT,
          last_updated_on TEXT
        );

        CREATE TABLE supplier_master (
          identifier TEXT PRIMARY KEY NOT NULL,
          supplier_name TEXT NOT NULL,
          country TEXT
        );

        CREATE TABLE drug_form_master (
          identifier TEXT PRIMARY KEY NOT NULL,
          dose_form TEXT NOT NULL
        );

        CREATE TABLE route_of_administration_master (
          identifier TEXT PRIMARY KEY NOT NULL,
          route_of_administration TEXT NOT NULL
        );

        CREATE TABLE generic_substance (
          generic_identifier TEXT NOT NULL,
          substance_identifier TEXT NOT NULL,
          position INTEGER NOT NULL,
          PRIMARY KEY (generic_identifier, substance_identifier, position)
        );

        CREATE TABLE generic_route (
          generic_identifier TEXT NOT NULL,
          route_identifier TEXT NOT NULL,
          position INTEGER NOT NULL,
          PRIMARY KEY (generic_identifier, route_identifier, position)
        );

        CREATE TABLE generic_drug_form (
          generic_identifier TEXT NOT NULL,
          drug_form_identifier TEXT NOT NULL,
          position INTEGER NOT NULL,
          PRIMARY KEY (generic_identifier, drug_form_identifier, position)
        );

        CREATE TABLE medicine_search (
          brand_identifier TEXT PRIMARY KEY NOT NULL,
          brand_name TEXT NOT NULL,
          product_identifier TEXT,
          product_name TEXT,
          supplier_identifier TEXT,
          supplier_name TEXT,
          generic_identifier TEXT,
          generic_name TEXT,
          substance_names TEXT,
          dosage_forms TEXT,
          routes TEXT
        );

        CREATE INDEX brand_product_idx ON brand_master(product_identifier);
        CREATE INDEX brand_supplier_idx ON brand_master(supplier_identifier);
        CREATE INDEX brand_generic_idx ON brand_master(generic_identifier);
        CREATE INDEX brand_name_idx ON brand_master(brand_name);
        CREATE INDEX product_name_idx ON product_master(product_name);
        CREATE INDEX generic_name_idx ON generic_master(generic_name);
        CREATE INDEX substance_name_idx ON substance_master(substance_name);
        CREATE INDEX supplier_name_idx ON supplier_master(supplier_name);
        CREATE INDEX drug_form_name_idx ON drug_form_master(dose_form);
        CREATE INDEX route_name_idx ON route_of_administration_master(route_of_administration);
        CREATE INDEX generic_substance_substance_idx ON generic_substance(substance_identifier);
        CREATE INDEX generic_route_route_idx ON generic_route(route_identifier);
        CREATE INDEX generic_drug_form_form_idx ON generic_drug_form(drug_form_identifier);
        """
    )

    connection.executemany(
        """
        INSERT INTO brand_master
          (identifier, brand_name, product_identifier, supplier_identifier,
           generic_identifier, license_number, license_status, excipient,
           last_updated_on)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            (
                row["Identifier"],
                row["Brand Name"],
                row["Product Identifier"],
                row["Supplier Identifier"],
                row["Generic Identifier"],
                row["License Number"],
                row["License Status"],
                row["Excipient"],
                row["last_updated_on"],
            )
            for row in data["brands"]
        ),
    )
    connection.executemany(
        "INSERT INTO product_master (identifier, product_name) VALUES (?, ?)",
        ((row["Identifier"], row["Product Name"]) for row in data["products"]),
    )
    connection.executemany(
        """
        INSERT INTO generic_master
          (identifier, generic_name, therapeutic_role, indication,
           contra_indication, interaction_with_drugs, classification_of_drugs,
           source_regulatory, last_updated_on)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            (
                row["Identifier"],
                row["Generic Name"],
                row["Therapeutic Role"],
                row["Indication"],
                row["Contra Indication"],
                row["Interaction with Drugs"],
                row["Classification of Drugs"],
                row["Source/ Regulatory"],
                row["last_updated_on"],
            )
            for row in data["generics"]
        ),
    )
    connection.executemany(
        """
        INSERT INTO substance_master
          (identifier, substance_name, cas_number, unii, substance_description,
           molecular_weight, toxicity, smile, inchi, iupac_name,
           molecular_formula, last_updated_on)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            (
                row["Identifier"],
                row["Substance Name"],
                row["CAS Number"],
                row["UNII"],
                row["Substance Description"],
                row["Molecular Weight"],
                row["Toxicity"],
                row["SMILE"],
                row["InChI"],
                row["IUPAC Name"],
                row["Molecular Formula"],
                row["last_updated_on"],
            )
            for row in data["substances"]
        ),
    )
    connection.executemany(
        "INSERT INTO supplier_master (identifier, supplier_name, country) VALUES (?, ?, ?)",
        ((row["Identifier"], row["Supplier Name"], row["Country"]) for row in data["suppliers"]),
    )
    connection.executemany(
        "INSERT INTO drug_form_master (identifier, dose_form) VALUES (?, ?)",
        ((row["Id"], row["Dose Form"]) for row in data["drug_forms"]),
    )
    connection.executemany(
        "INSERT INTO route_of_administration_master (identifier, route_of_administration) VALUES (?, ?)",
        ((row["Identifier"], row["RouteOfAdministration"]) for row in data["routes"]),
    )

    generic_substance_rows: list[tuple] = []
    generic_route_rows: list[tuple] = []
    generic_form_rows: list[tuple] = []
    for generic in data["generics"]:
        generic_id = generic["Identifier"]
        generic_substance_rows.extend(
            (generic_id, identifier, position)
            for position, identifier in enumerate(split_identifiers(generic["Substance Identifier"]))
        )
        generic_route_rows.extend(
            (generic_id, identifier, position)
            for position, identifier in enumerate(split_identifiers(generic["Route of Administration"]))
        )
        generic_form_rows.extend(
            (generic_id, identifier, position)
            for position, identifier in enumerate(split_identifiers(generic["Dose Form"]))
        )
    connection.executemany(
        "INSERT INTO generic_substance (generic_identifier, substance_identifier, position) VALUES (?, ?, ?)",
        generic_substance_rows,
    )
    connection.executemany(
        "INSERT INTO generic_route (generic_identifier, route_identifier, position) VALUES (?, ?, ?)",
        generic_route_rows,
    )
    connection.executemany(
        "INSERT INTO generic_drug_form (generic_identifier, drug_form_identifier, position) VALUES (?, ?, ?)",
        generic_form_rows,
    )

    search_rows: list[tuple] = []
    for brand in data["brands"]:
        generic = generics_by_id.get(brand["Generic Identifier"], {})
        product = products_by_id.get(brand["Product Identifier"], {})
        supplier = suppliers_by_id.get(brand["Supplier Identifier"], {})
        substance_names = [
            substances_by_id[identifier]["Substance Name"]
            for identifier in split_identifiers(generic.get("Substance Identifier", ""))
            if identifier in substances_by_id
        ]
        dosage_forms = [
            forms_by_id[identifier]["Dose Form"]
            for identifier in split_identifiers(generic.get("Dose Form", ""))
            if identifier in forms_by_id
        ]
        routes = [
            routes_by_id[identifier]["RouteOfAdministration"]
            for identifier in split_identifiers(generic.get("Route of Administration", ""))
            if identifier in routes_by_id
        ]
        search_rows.append(
            (
                brand["Identifier"],
                brand["Brand Name"],
                brand["Product Identifier"],
                product.get("Product Name", ""),
                brand["Supplier Identifier"],
                supplier.get("Supplier Name", ""),
                brand["Generic Identifier"],
                generic.get("Generic Name", ""),
                " · ".join(substance_names),
                " · ".join(dosage_forms),
                " · ".join(routes),
            )
        )
    connection.executemany(
        """
        INSERT INTO medicine_search
          (brand_identifier, brand_name, product_identifier, product_name,
           supplier_identifier, supplier_name, generic_identifier, generic_name,
           substance_names, dosage_forms, routes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        search_rows,
    )
    connection.executescript(
        """
        CREATE VIRTUAL TABLE medicine_search_fts USING fts5(
          brand_name,
          product_name,
          generic_name,
          substance_names,
          dosage_forms,
          routes,
          content='medicine_search',
          content_rowid='rowid',
          tokenize='unicode61 remove_diacritics 2'
        );
        INSERT INTO medicine_search_fts(medicine_search_fts) VALUES ('rebuild');
        CREATE INDEX medicine_search_generic_idx ON medicine_search(generic_identifier);
        CREATE INDEX medicine_search_product_idx ON medicine_search(product_identifier);
        """
    )

    counts = {
        table: connection.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        for table in (
            "brand_master",
            "product_master",
            "generic_master",
            "substance_master",
            "supplier_master",
            "drug_form_master",
            "route_of_administration_master",
            "generic_substance",
            "generic_route",
            "generic_drug_form",
            "medicine_search",
        )
    }
    unresolved = {
        "brands_missing_generic": connection.execute(
            """
            SELECT COUNT(*) FROM brand_master b
            LEFT JOIN generic_master g ON g.identifier = b.generic_identifier
            WHERE b.generic_identifier <> '' AND g.identifier IS NULL
            """
        ).fetchone()[0],
        "brands_missing_product": connection.execute(
            """
            SELECT COUNT(*) FROM brand_master b
            LEFT JOIN product_master p ON p.identifier = b.product_identifier
            WHERE b.product_identifier <> '' AND p.identifier IS NULL
            """
        ).fetchone()[0],
        "brands_missing_supplier": connection.execute(
            """
            SELECT COUNT(*) FROM brand_master b
            LEFT JOIN supplier_master s ON s.identifier = b.supplier_identifier
            WHERE b.supplier_identifier <> '' AND s.identifier IS NULL
            """
        ).fetchone()[0],
    }
    add_metadata(connection, "catalogue_name", "NRCeS Common Drug Codes for India")
    add_metadata(connection, "source_package", args.package.name)
    add_metadata(connection, "source_sha256", source_sha256)
    add_metadata(connection, "source_license", "CC BY 4.0 with SNOMED CT Affiliate License terms")
    add_metadata(connection, "imported_at", "2026-09-06")
    add_metadata(connection, "counts", json.dumps(counts, sort_keys=True))
    add_metadata(connection, "unresolved_references", json.dumps(unresolved, sort_keys=True))
    add_metadata(connection, "license_text", license_text)
    connection.commit()
    connection.execute("VACUUM")
    connection.close()

    print(json.dumps({"counts": counts, "unresolved_references": unresolved}, indent=2, sort_keys=True))
    print(f"Created {args.output} ({args.output.stat().st_size} bytes)")


if __name__ == "__main__":
    main()