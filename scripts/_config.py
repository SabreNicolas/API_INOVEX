"""
Configuration partagée pour tous les scripts CAP Exploitation.
Les credentials sont lus depuis les variables d'environnement ou un fichier .env.
"""
import os
import sys
import argparse
from datetime import datetime, timedelta
from dotenv import load_dotenv
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import warnings
import logging

# Charger .env
load_dotenv()

# --- Logging ---
LOG_FORMAT = "%(asctime)s [%(levelname)s] %(message)s"
logging.basicConfig(level=logging.INFO, format=LOG_FORMAT)
logger = logging.getLogger("cap-scripts")

# --- Suppression des warnings SSL (certificat interne auto-signé) ---
warnings.filterwarnings("ignore", message="Unverified HTTPS request")

# --- Configuration API CAP Exploitation ---
CAP_BASE_URL = os.getenv("CAP_BASE_URL", "https://fr-couvinove301:3100")
CAP_TOKEN = os.getenv("CAP_TOKEN")
if not CAP_TOKEN:
    logger.error("Variable d'environnement CAP_TOKEN manquante.")
    sys.exit(1)

CAP_HEADERS = {"Authorization": f"Bearer {CAP_TOKEN}"}

# --- Configuration AVEVA ---
AVEVA_USER = os.getenv("AVEVA_USER", "capexploitation")
AVEVA_PASSWORD = os.getenv("AVEVA_PASSWORD")

# --- Configuration EVELER ---
EVELER_URL = os.getenv("EVELER_URL", "https://api.eveler.pro/api/client")
EVELER_TOKEN = os.getenv("EVELER_TOKEN")
EVELER_SECRET = os.getenv("EVELER_SECRET")

# --- Configuration SMTP ---
SMTP_USER = os.getenv("USER_SMTP")
SMTP_PASSWORD = os.getenv("PWD_SMTP")
SMTP_PORT = os.getenv("PORT_SMTP")
SMTP_HOST = os.getenv("HOST_SMTP")

# Liste de TAGs nécessitant un multiplicateur x24 (débit -> volume journalier)
# TODO: à terme, stocker cette info en base de données
TAGS_MULTIPLY_24 = {
    "P_Active/MESURE.U",
    "0MKA60CE100ET/MESURE.U",
    "0MKA60CE108/MESURE.U",
    "1LBA10CF901FT/MESURE.U",
    "2LBA10CF901FT/MESURE.U",
    "3LBA10CF001FT/MESURE.U",
}


def create_session(max_retries=3, backoff_factor=0.5, timeout=30):
    """Crée une session HTTP avec retry automatique."""
    session = requests.Session()
    retry = Retry(
        total=max_retries,
        backoff_factor=backoff_factor,
        status_forcelist=[500, 502, 503, 504],
        allowed_methods=["GET", "PUT", "POST", "DELETE"],
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    session.verify = False
    session.timeout = timeout
    return session


def cap_get(session, path, **params):
    """GET vers l'API CAP Exploitation avec gestion d'erreur."""
    url = f"{CAP_BASE_URL}{path}"
    resp = session.get(url, headers=CAP_HEADERS, params=params)
    resp.raise_for_status()
    return resp.json()


def cap_put(session, path, **params):
    """PUT vers l'API CAP Exploitation avec gestion d'erreur."""
    url = f"{CAP_BASE_URL}{path}"
    resp = session.put(url, headers=CAP_HEADERS, params=params)
    resp.raise_for_status()
    return resp


def cap_delete(session, path):
    """DELETE vers l'API CAP Exploitation."""
    url = f"{CAP_BASE_URL}{path}"
    resp = session.delete(url, headers=CAP_HEADERS)
    resp.raise_for_status()
    return resp


def parse_date_arg(description="Script CAP Exploitation"):
    """Parse un argument --date optionnel (format DD/MM/YYYY). Retourne la date cible."""
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument(
        "--date",
        type=str,
        default=None,
        help="Date cible au format DD/MM/YYYY (défaut: veille)",
    )
    args = parser.parse_args()
    if args.date:
        return datetime.strptime(args.date, "%d/%m/%Y").date()
    return datetime.now().date() - timedelta(days=1)


def get_sites(session):
    """Récupère la liste des sites CAP Exploitation."""
    return cap_get(session, "/sites")["data"]


def get_conversions(session):
    """Récupère la liste des conversions."""
    return cap_get(session, "/getConversions")["data"]


def apply_conversion(value, product_unit, source_unit, conversions):
    """Applique la conversion d'unité si nécessaire."""
    if not source_unit or product_unit.lower() == source_unit.lower():
        return value
    for conv in conversions:
        if (
            source_unit.lower() == conv["uniteBase"].lower()
            and product_unit.lower() == conv["uniteCible"].lower()
        ):
            operateur = conv["conversion"][0]
            valeur = int(conv["conversion"][1:])
            if operateur == "*":
                return value * valeur
            elif operateur == "/":
                return value / valeur
    return value


def insert_measure(session, date, value, product_id):
    """Insère une mesure dans CAP Exploitation."""
    cap_put(
        session,
        "/Measure",
        EntryDate=str(date),
        Value=str(value),
        ProductId=str(product_id),
        ProducerId="0",
    )
