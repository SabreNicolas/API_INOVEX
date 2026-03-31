"""
Script de récupération des données EVELER et insertion dans CAP Exploitation.
Fusionne scriptEveler.py et scriptEvelerRecup.py (utiliser --date pour une date spécifique).

Usage:
    python scriptEveler.py                    # Données de la veille
    python scriptEveler.py --date 15/03/2026  # Données d'une date spécifique
"""
import time
from datetime import datetime, timedelta

import pytz
import requests

from _config import (
    EVELER_SECRET, EVELER_TOKEN, EVELER_URL,
    create_session, insert_measure, cap_get, logger, parse_date_arg,
)


def get_eveler_token(session):
    """Authentification EVELER et récupération du token (valable 1h)."""
    if not EVELER_TOKEN or not EVELER_SECRET:
        logger.error("Variables EVELER_TOKEN / EVELER_SECRET manquantes.")
        return None

    headers = {
        "accept": "application/json",
        "User-Agent": "Mozilla/5.0",
    }
    r = session.post(
        f"{EVELER_URL}/auth/login",
        params={"token": EVELER_TOKEN, "secret": EVELER_SECRET},
        headers=headers,
        verify=False,
    )
    if r.status_code == 200 and r.json().get("success"):
        token = r.json()["data"]["token"]
        headers["Authorization"] = token
        return headers
    else:
        logger.error(f"Erreur authentification EVELER: HTTP {r.status_code}")
        return None


def compute_utc_range(target_date):
    """Calcule les bornes UTC pour une date donnée (timezone Europe/Paris)."""
    paris_tz = pytz.timezone("Europe/Paris")
    utc_offset_hours = paris_tz.utcoffset(datetime.now()).total_seconds() / 3600

    start = datetime.combine(target_date, datetime.min.time()) - timedelta(hours=utc_offset_hours)
    end = start + timedelta(days=1)
    return start, end


def main():
    target_date = parse_date_arg("Script EVELER")
    logger.info(f"Début du script EVELER - date cible: {target_date}")

    session = create_session()
    eveler_headers = get_eveler_token(session)
    if not eveler_headers:
        return

    start_utc, end_utc = compute_utc_range(target_date)

    products = cap_get(session, "/ProductEveler")["data"]

    for p in products:
        product_id = p["Id"]
        tag_parts = p["TAG"].split(":")
        id_compteur = tag_parts[1]
        type_energie_raw = tag_parts[2]

        type_energie = "active" if type_energie_raw == "ACTIVE" else "reactive+"
        channel = f"power:{type_energie}"

        logger.info(f"Produit {product_id} ({p['Name']}) - compteur={id_compteur}, channel={channel}")

        complete_url = f"{EVELER_URL}/meter/{id_compteur}/data/{channel}/{start_utc}/{end_utc}"

        try:
            r = session.get(complete_url, headers=eveler_headers, verify=False)
        except Exception as e:
            logger.warning(f"Erreur requête EVELER compteur={id_compteur}: {e}")
            continue

        value_to_insert = 0.0

        if r.status_code == 200 and r.json().get("success"):
            json_data = r.json()["data"]
            values = json_data.get("values", [])

            for data_point in values:
                # Conversion kW -> kWh (points toutes les 5 min)
                value_to_insert += data_point["value"] * (5 / 60)

            # Conversion kWh -> MWh
            value_to_insert /= 1000
            logger.info(f"Valeur calculée: {value_to_insert} MWh")
        else:
            logger.warning(f"Erreur EVELER HTTP {r.status_code} pour compteur={id_compteur}")

        try:
            insert_measure(session, target_date, value_to_insert, product_id)
        except Exception as e:
            logger.error(f"Erreur insertion mesure produit {product_id}: {e}")

        time.sleep(2)

    logger.info("Fin du script EVELER")


if __name__ == "__main__":
    main()