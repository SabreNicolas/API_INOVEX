"""
Script de vérification de la remontée des données (ImaginData & Eveler).
Envoie un récapitulatif par mail si des TAGs n'ont pas de données.

Usage:
    python scriptAlertRemonteeDonnees.py
"""
import smtplib
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from _config import (
    SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_USER,
    create_session, cap_get, logger,
)

MAIL_TO = "nsabre@kerlan-info.fr;anthony.gourdy@paprec.com;mcoulon@kerlan-info.fr"


def build_report(session):
    aujourdhui = datetime.now().date()
    hier = aujourdhui - timedelta(days=1)
    avant_hier = aujourdhui - timedelta(days=2)

    body = f"<h1>Récapitulatif de remontée des TAGS (ImaginData & EVELER) du {aujourdhui}</h1>\n\n"

    sites = cap_get(session, "/sites")["data"]

    for site in sites:
        site_id = site["id"]
        site_name = str(site["localisation"]).upper()
        nb_tag = 0

        body += f"<div style='border:solid 1px'><p style='color:blue'>//*********** {site_name} ***********//" + "</p>\n"

        products = cap_get(session, "/getProductsWithTagClassique", idUsine=site_id)["data"]

        for product in products:
            nb_tag += 1
            product_id = product["Id"]

            try:
                val_hier_data = cap_get(session, f"/ValuesProducts/{product_id}/{hier}")["data"]
                val_hier = val_hier_data[0] if val_hier_data else {"Value": "N/A"}
            except Exception:
                val_hier = {"Value": "N/A"}

            try:
                val_avant_hier_data = cap_get(session, f"/ValuesProducts/{product_id}/{avant_hier}")["data"]
                val_avant_hier = val_avant_hier_data[0] if val_avant_hier_data else {"Value": "N/A"}
            except Exception:
                val_avant_hier = {"Value": "N/A"}

            if val_hier["Value"] == "N/A" and val_avant_hier["Value"] == "N/A":
                body += f"<p style='color:red'>*Pas de Valeur* {site_name} - {product['Name']} - {product['TAG']}</p>\n"
            elif val_hier["Value"] == 0 and val_avant_hier["Value"] == 0:
                body += f"<p style='color:orange'>*Valeurs à 0* {site_name} - {product['Name']} - {product['TAG']}</p>\n"

        body += f"<p>****** Nombre de TAGs sur le site de {site_name} -> {nb_tag}</p>\n"
        body += "</div><br>\n\n"

    return body


def send_mail(body):
    if not all([SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD]):
        logger.error("Configuration SMTP incomplète, mail non envoyé.")
        return

    mimemsg = MIMEMultipart()
    mimemsg["From"] = SMTP_USER
    mimemsg["To"] = MAIL_TO
    mimemsg["Subject"] = "CAP EXPLOITATION - Récapitulatif du Jour"
    mimemsg.attach(MIMEText(body, "html"))

    try:
        connection = smtplib.SMTP(host=SMTP_HOST, port=int(SMTP_PORT))
        connection.starttls()
        connection.login(SMTP_USER, SMTP_PASSWORD)
        connection.send_message(mimemsg)
        connection.quit()
        logger.info("Mail récapitulatif envoyé")
    except Exception as e:
        logger.error(f"Erreur envoi mail: {e}")


def main():
    session = create_session()
    body = build_report(session)
    # N'envoyer le mail que si le body contient du contenu significatif
    if len(body) > 60:
        send_mail(body)
    logger.info("Fin du script de vérification des remontées")


if __name__ == "__main__":
    main()
