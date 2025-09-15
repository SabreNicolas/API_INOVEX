import requests
import mysql.connector
from datetime import datetime, timedelta
import warnings
#Disable warnings
warnings.filterwarnings("ignore")

headers = {"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6ImZmcmV6cXNrejdmIiwiaWF0IjoxNjg2NzM1MTEyfQ.uk7IdzysJioPG3pdV2w99jNPHq5Uj6CWpIDiZ_WGhY0"}

#Récupération de la date de la veille
aujourdhui = datetime.now().date()
hier = aujourdhui - timedelta(days=1)
avanthier = hier - timedelta(days=1)


print("Début du script alertes produits le " + str(aujourdhui))

#récupération de la liste des sites CAP Exploitation
req = "https://fr-couvinove301:3100/sites"
response = requests.get(req, headers = headers, verify=False)
listeSites = response.json()

print("\n\n\nDébut du script alertes produits !")
for site in listeSites['data']:
    print(str(site['id']))
    req = f"https://fr-couvinove301:3100/getProductsWithAlerteActive?idUsine={site['id']}"
    response = requests.get(req, headers=headers, verify=False)
    listProducts = response.json()["data"]
    alertes = []
    for product in listProducts:
        req = f"https://fr-couvinove301:3100/ValuesProducts/{product['Id']}/{avanthier}"
        response = requests.get(req, headers=headers, verify=False)
        valAvantHier = response.json()['data']
        req = f"https://fr-couvinove301:3100/ValuesProducts/{product['Id']}/{hier}"
        response = requests.get(req, headers=headers, verify=False)
        valHier = response.json()['data']
        if product['typeAlerte'] == "max":
            if float(valHier[0]['Value']) > float(product['valeurAlerte']):
                valeur_max = product['valeurAlerte']
                alertes.append({
                    'typeAlerte': 'max',
                    'nomProduit': product['Name'],
                    'idProduct': product['Id'],
                    'valeurHier': valHier[0]['Value'],
                    'valeurMax': valeur_max
                })
                print(f"Alerte max déclenchée pour le produit {product['Id']} sur le site {site['id']}")
        elif product['typeAlerte'] == "min":
            if float(valHier[0]['Value']) < float(product['valeurAlerte']):
                valeur_min = product['valeurAlerte']
                alertes.append({
                    'typeAlerte': 'min',
                    'nomProduit': product['Name'],
                    'idProduct': product['Id'],
                    'valeurHier': valHier[0]['Value'],
                    'valeurMin': valeur_min
                })
                print(f"Alerte min déclenchée pour le produit {product['Id']} sur le site {site['id']}")
        elif product['typeAlerte'] == "ecart":
            ecart = abs(float(valHier[0]['Value']) - float(valAvantHier[0]['Value']))
            if ecart > float(product['valeurAlerte']):
                alertes.append({
                    'typeAlerte': 'ecart',
                    'nomProduit': product['Name'],
                    'idProduct': product['Id'],
                    'valeurHier': valHier[0]['Value'],
                    'valeurAvantHier': valAvantHier[0]['Value'],
                    'ecart': ecart
                })
                print(f"Alerte écart déclenchée pour le produit {product['Id']} sur le site {site['id']}")
    # Envoi d'un mail groupé si alertes détectées
    if alertes:
        # Construction du paramètre alertes pour l'API (JSON encodé en string)
        import json
        alertes_str = json.dumps(alertes)
        from urllib.parse import quote
        alertes_encoded = quote(alertes_str)
        request_alerte = f"https://fr-couvinove301:3100/envoyerMailAlerte?idUsine={site['id']}&alertes={alertes_encoded}"
        print(f"Mail groupé pour le site {site['id']} : {request_alerte}")
        requests.get(request_alerte, headers=headers, verify=False)
print("Fin du script alertes produits !")