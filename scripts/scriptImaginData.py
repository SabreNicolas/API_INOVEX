"""
Script de récupération des données Rondier et insertion dans CAP Exploitation.
Fusionne scriptImaginData.py et scriptImaginDataRecup.py (utiliser --date pour une date spécifique).

Usage:
    python scriptImaginData.py                    # Données de la veille
    python scriptImaginData.py --date 15/03/2026  # Données d'une date spécifique
"""
import re

from _config import create_session, cap_get, insert_measure, logger, parse_date_arg


def main():
    target_date = parse_date_arg("Script ImaginData / Rondier")
    target_date_rondier = target_date.strftime("%d/%m/%Y")

    logger.info(f"Début du script Rondier - date cible: {target_date}")

    session = create_session()
    sites = cap_get(session, "/sites")["data"]

    for site in sites:
        site_id = site["id"]
        logger.info(f"Traitement site {site_id}")

        products = cap_get(session, "/getProductsWithElementRondier", idUsine=site_id)["data"]

        for product in products:
            try:
                values = cap_get(
                    session,
                    "/valueElementDay",
                    id=product["idElementRondier"],
                    date=target_date_rondier,
                )["data"]
            except Exception as e:
                logger.warning(f"Erreur récupération rondier produit {product['Id']}: {e}")
                continue

            for val in values:
                raw_value = val["value"]
                # Vérifier que la valeur est un nombre valide
                if raw_value != "/" and re.match(r"^\d+\.?\d*$", raw_value):
                    try:
                        insert_measure(session, target_date, raw_value, product["Id"])
                    except Exception as e:
                        logger.error(f"Erreur insertion mesure produit {product['Id']}: {e}")
                else:
                    logger.debug(f"Valeur ignorée: {raw_value}")

    logger.info("Fin du script Rondier")


if __name__ == "__main__":
    main()
