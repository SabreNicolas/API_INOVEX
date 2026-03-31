"""
Script de récupération des données AVEVA et insertion dans CAP Exploitation.
Fusionne scriptAveva.py et scriptAvevaRecup.py (utiliser --date pour une date spécifique).

Usage:
    python scriptAveva.py                    # Données de la veille
    python scriptAveva.py --date 15/03/2026  # Données d'une date spécifique
"""
from datetime import datetime, timedelta

from requests_ntlm import HttpNtlmAuth

from _config import (
    AVEVA_PASSWORD, AVEVA_USER, TAGS_MULTIPLY_24,
    apply_conversion, create_session, cap_get, get_conversions, get_sites,
    insert_measure, logger, parse_date_arg,
)


def fetch_aveva_data(session, url, auth):
    """Récupère les données depuis l'API AVEVA."""
    resp = session.get(url, auth=auth, verify=False)
    resp.raise_for_status()
    return resp.json()


def compute_value(product, list_data, session, aveva_auth):
    """Calcule la valeur à insérer selon le type de récupération."""
    type_recup = product["typeRecupEMonitoring"]

    if not list_data["value"]:
        return None

    if type_recup == "cumul" and len(list_data["value"]) > 1:
        # Cumul = somme des moyennes sur des résolutions de 10 minutes
        total = sum(
            res["Average"]
            for res in list_data["value"]
            if res["Average"] != "NaN"
        )
        return total

    entry = list_data["value"][0]

    if type_recup == "tafMin" and entry["Minimum"] != "NaN":
        return entry["Minimum"]
    elif type_recup == "tafMax" and entry["Maximum"] != "NaN":
        return entry["Maximum"]
    elif type_recup == "cumul" and entry["Maximum"] != "NaN" and entry["Minimum"] != "NaN":
        return entry["Maximum"] - entry["Minimum"]
    else:
        return entry["Average"]


def process_site(session, site, target_date, conversions, aveva_auth):
    """Traite un site : récupère les données AVEVA et insère les mesures."""
    site_id = site["id"]
    ip_aveva = site["ipAveva"]
    debut = f"{target_date}T00:00:00Z"
    fin = f"{target_date}T23:59:59Z"
    dernier_debut = f"{target_date}T22:59:50Z"
    dernier_fin = f"{target_date}T22:59:59Z"

    # --- TAG CLASSIQUE ---
    products_classique = cap_get(session, "/getProductsWithTagClassique", idUsine=site_id)["data"]

    for product in products_classique:
        tag = product["TAG"]
        type_recup = product["typeRecupEMonitoring"]

        try:
            if type_recup == "cumul":
                url = f"{ip_aveva}/Historian/v2/AnalogSummary?$filter=FQN+eq+'{tag}'+and+StartDateTime+ge+{debut}+and+EndDateTime+le+{fin}&resolution=600000"
            else:
                url = f"{ip_aveva}/Historian/v2/AnalogSummary?$filter=FQN+eq+'{tag}'+and+StartDateTime+ge+{debut}+and+EndDateTime+le+{fin}&resolution=86400000"

            list_data = fetch_aveva_data(session, url, aveva_auth)
        except Exception as e:
            logger.warning(f"Erreur récupération AVEVA tag={tag}, site={site_id}: {e}")
            continue

        recup = compute_value(product, list_data, session, aveva_auth)
        if recup is None or recup == "NaN":
            continue

        # Conversion d'unité si nécessaire
        if list_data["value"] and "Unit" in list_data["value"][0]:
            source_unit = list_data["value"][0]["Unit"]
            recup = apply_conversion(recup, product["Unit"], source_unit, conversions)

        # Multiplicateur x24 pour certains TAGs (débit -> volume)
        if tag in TAGS_MULTIPLY_24:
            recup = recup * 24

        insert_measure(session, target_date, recup, product["Id"])

    # --- TAG DERNIÈRE VALEUR JOUR ---
    products_derniere = cap_get(session, "/getProductsWithTagDerniere", idUsine=site_id)["data"]

    for product in products_derniere:
        tag = product["TAG"]
        try:
            url = f"{ip_aveva}/Historian/v2/AnalogSummary?$filter=FQN+eq+'{tag}'+and+StartDateTime+ge+{dernier_debut}+and+EndDateTime+le+{dernier_fin}&RetrievalMode=Cyclic"
            list_data = fetch_aveva_data(session, url, aveva_auth)
        except Exception as e:
            logger.warning(f"Erreur récupération AVEVA (dernière) tag={tag}, site={site_id}: {e}")
            continue

        if list_data["value"] and list_data["value"][0]["Average"] != "NaN":
            insert_measure(session, target_date, list_data["value"][0]["Average"], product["Id"])


def main():
    target_date = parse_date_arg("Script AVEVA")
    logger.info(f"Début du script AVEVA - date cible: {target_date}")

    if not AVEVA_PASSWORD:
        logger.error("Variable d'environnement AVEVA_PASSWORD manquante.")
        return

    session = create_session()
    aveva_auth = HttpNtlmAuth(AVEVA_USER, AVEVA_PASSWORD)
    conversions = get_conversions(session)
    sites = cap_get(session, "/sitesAveva")["data"]

    for site in sites:
        logger.info(f"Traitement site AVEVA: {site['id']}")
        try:
            process_site(session, site, target_date, conversions, aveva_auth)
        except Exception as e:
            logger.error(f"Erreur site {site['id']}: {e}")

    logger.info("Fin du script AVEVA")


if __name__ == "__main__":
    main()
