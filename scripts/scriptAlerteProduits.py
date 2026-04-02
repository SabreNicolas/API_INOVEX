"""
Script d'alertes produits CAP Exploitation.
Vérifie les seuils (max, min, écart) et envoie un mail groupé par site.

Usage:
    python scriptAlerteProduits.py
"""
import json
from datetime import datetime, timedelta
from urllib.parse import quote

from _config import create_session, cap_get, logger


def check_alerts(session):
    aujourdhui = datetime.now().date()
    hier = aujourdhui - timedelta(days=1)
    avanthier = hier - timedelta(days=1)

    logger.info(f"Début du script alertes produits le {aujourdhui}")

    sites = cap_get(session, "/sites")["data"]

    for site in sites:
        site_id = site["id"]
        logger.info(f"Traitement site {site_id}")

        products = cap_get(session, "/getProductsWithAlerteActive", idUsine=site_id)["data"]
        alertes = []

        for product in products:
            product_id = product["Id"]
            try:
                val_avant_hier = cap_get(session, f"/ValuesProducts/{product_id}/{avanthier}")["data"]
                val_hier = cap_get(session, f"/ValuesProducts/{product_id}/{hier}")["data"]
            except Exception as e:
                logger.warning(f"Impossible de récupérer les valeurs du produit {product_id}: {e}")
                continue

            if not val_hier or not val_avant_hier:
                continue

            valeur_hier = float(val_hier[0]["Value"])
            valeur_avant_hier = float(val_avant_hier[0]["Value"])
            seuil = float(product["valeurAlerte"])
            type_alerte = product["typeAlerte"]

            if type_alerte == "max" and valeur_hier > seuil:
                alertes.append({
                    "typeAlerte": "max",
                    "nomProduit": product["Name"],
                    "idProduct": product_id,
                    "valeurHier": val_hier[0]["Value"],
                    "valeurMax": product["valeurAlerte"],
                })
                logger.info(f"Alerte max: produit {product_id}, site {site_id}")

            elif type_alerte == "min" and valeur_hier < seuil:
                alertes.append({
                    "typeAlerte": "min",
                    "nomProduit": product["Name"],
                    "idProduct": product_id,
                    "valeurHier": val_hier[0]["Value"],
                    "valeurMin": product["valeurAlerte"],
                })
                logger.info(f"Alerte min: produit {product_id}, site {site_id}")

            elif type_alerte == "ecart":
                ecart = abs(valeur_hier - valeur_avant_hier)
                if ecart > seuil:
                    alertes.append({
                        "typeAlerte": "ecart",
                        "nomProduit": product["Name"],
                        "idProduct": product_id,
                        "valeurHier": val_hier[0]["Value"],
                        "valeurAvantHier": val_avant_hier[0]["Value"],
                        "ecart": ecart,
                    })
                    logger.info(f"Alerte écart: produit {product_id}, site {site_id}")

        if alertes:
            alertes_encoded = quote(json.dumps(alertes))
            try:
                cap_get(session, "/envoyerMailAlerte", idUsine=site_id, alertes=alertes_encoded)
                logger.info(f"Mail groupé envoyé pour le site {site_id} ({len(alertes)} alertes)")
            except Exception as e:
                logger.error(f"Erreur envoi mail site {site_id}: {e}")

    logger.info("Fin du script alertes produits")


def main():
    session = create_session()
    check_alerts(session)


if __name__ == "__main__":
    main()