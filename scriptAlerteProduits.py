import requests
import mysql.connector
from datetime import datetime, timedelta
import warnings
#Disable warnings
warnings.filterwarnings("ignore")

headers = {"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6ImZmcmV6cXNrejdmIiwiaWF0IjoxNjg2NzM1MTEyfQ.uk7IdzysJioPG3pdV2w99jNPHq5Uj6CWpIDiZ_WGhY0"}

#Récupération de la date de la veille
aujourdhui = datetime.now().date()
hier = input("Saisissez la date que vous souhaitez (DD/MM/YYYY)")
hier = datetime.strptime(hier, "%d/%m/%Y").date()
avanthier = hier - timedelta(days=1)
avanthier = datetime.strptime(str(avanthier), "%Y-%m-%d").date()


print("Début du script alertes produits le " + str(aujourdhui))

#récupération de la liste des sites CAP Exploitation
req = "https://fr-couvinove301:3100/sites"
response = requests.get(req, headers = headers, verify=False)
listeSites = response.json()

print("\n\n\nDébut du script alertes produits !")
#Boucle sur les sites pour insérer les valeur site par site
for site in listeSites['data'] :
    print(str(site['id']))
    #Récupération de la liste des produits avec un element de récupération rondier dans chaque usine
    req = "https://fr-couvinove301:3100/getProductsWithAlerteActive?idUsine=" + str(site['id'])
    response = requests.get(req, headers = headers, verify=False)
    listProducts = response.json()
    listProducts = listProducts["data"]

    #On boucle sur les produits et les données rondier
    for product in listProducts :
        req = "https://fr-couvinove301:3100/ValuesProducts/" + str(product['Id']) + "/" + str(avanthier) 
        response = requests.get(req, headers = headers, verify=False)
        valAvantHier = response.json()
        valAvantHier = valAvantHier['data']

        req = "https://fr-couvinove301:3100/ValuesProducts/" + str(product['Id']) + "/" + str(hier) 
        response = requests.get(req, headers = headers, verify=False)
        valHier = response.json()
        valHier = valHier['data']

        if(product['TypeAlerte'] == "max"):
            if float(valHier[0]['Value'].replace(",",".")) > float(product['valeurAlerte'].replace(",",".")) and float(valAvantHier[0]['Value'].replace(",",".")) <= float(product['SeuilAlerte'].replace(",",".")):
                #Envoi de l'alerte
                request_alerte = f"https://fr-couvinove301:3100/envoierMailAlerte?valeurHier={valHier[0]['Value']}&valeurAvantHier={valAvantHier[0]['Value']}&idUsine={site['id']}&ecart={abs(float(valHier[0]['Value'].replace(',','.')) - float(valAvantHier[0]['Value'].replace(',','.')))}&typeAlerte={product['TypeAlerte']}&nomProduit={product['Nom']}&idProduct={product['Id']}"
                print("Alerte max déclenchée pour le produit " + str(product['Id']) + " sur le site " + str(site['id']))
        elif(product['TypeAlerte'] == "min"):
            if float(valHier[0]['Value'].replace(",",".")) < float(product['valeurAlerte'].replace(",",".")) and float(valAvantHier[0]['Value'].replace(",",".")) >= float(product['SeuilAlerte'].replace(",",".")):
                #Envoi de l'alerte
                request_alerte = f"https://fr-couvinove301:3100/envoierMailAlerte?valeurHier={valHier[0]['Value']}&valeurAvantHier={valAvantHier[0]['Value']}&idUsine={site['id']}&ecart={abs(float(valHier[0]['Value'].replace(',','.')) - float(valAvantHier[0]['Value'].replace(',','.')))}&typeAlerte={product['TypeAlerte']}&nomProduit={product['Nom']}&idProduct={product['Id']}"
                print("Alerte min déclenchée pour le produit " + str(product['Id']) + " sur le site " + str(site['id']))
        elif(product['TypeAlerte'] == "ecart"):
            if abs(float(valHier[0]['Value'].replace(",",".")) - float(valAvantHier[0]['Value'].replace(",","."))) > float(product['valeurAlerte'].replace(",",".")):
                #Envoi de l'alerte
                request_alerte = f"https://fr-couvinove301:3100/envoierMailAlerte?valeurHier={valHier[0]['Value']}&valeurAvantHier={valAvantHier[0]['Value']}&idUsine={site['id']}&ecart={abs(float(valHier[0]['Value'].replace(',','.')) - float(valAvantHier[0]['Value'].replace(',','.')))}&typeAlerte={product['TypeAlerte']}&nomProduit={product['Nom']}&idProduct={product['Id']}"
                print("Alerte écart déclenchée pour le produit " + str(product['Id']) + " sur le site " + str(site['id']))
        requests.post(request_alerte, headers=headers, verify=False)
print("Fin du script Rondier !")

print("Fin du script Imagindata !")