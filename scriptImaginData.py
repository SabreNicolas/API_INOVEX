import requests
import mysql.connector
from datetime import datetime, timedelta

#Récupération de la date de la veille
aujourdhui = datetime.now().date()
hier = aujourdhui - timedelta (days=1)
hierRondier = f'{hier:%d/%m/%Y}'


#récupération de la liste des sites CAP Exploitation
req = "https://fr-couvinove301:3102/sites"
response = requests.get(req, headers = {"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6ImZmcmV6cXNrejdmIiwiaWF0IjoxNjg2NzM1MTEyfQ.uk7IdzysJioPG3pdV2w99jNPHq5Uj6CWpIDiZ_WGhY0"}, verify=False)
listeSites = response.json()

#Connexion à la base de données ImagineData
connexion = mysql.connector.connect(
    host="imagindata.com",
    user="siege",
    password="ml!25dmSg:85fGas",
    database="siege",
    port="33060"
)

# Création du curseur
curseur = connexion.cursor()
#Boucle sur les sites pour insérer les valeur site par site
for site in listeSites['data'] :

    # Récupération des produits avec un TAG dans chaque usine
    requete = "SELECT * FROM tagflow JOIN site ON site.SitId = tagflow.FkSitId WHERE site.SitName = '" + site['localisation'] + "' AND tafUtsTs = '"+ str(hier) +"';"
    curseur.execute(requete)
    listData = curseur.fetchall()

    #Récupération de la liste des produits avec un TAG dans chaque usine
    req = "https://fr-couvinove301:3102/getProductsWithTag?idUsine=" + str(site['id'])
    response = requests.get(req, headers = {"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6ImZmcmV6cXNrejdmIiwiaWF0IjoxNjg2NzM1MTEyfQ.uk7IdzysJioPG3pdV2w99jNPHq5Uj6CWpIDiZ_WGhY0"}, verify=False)
    listProducts = response.json()
    listProducts = listProducts["data"]

    #On boucle sur les produits et les données imagine data
    for data in listData :
        for product in listProducts :
            #Si les TAG correspondent on insère en bdd
            if "TAG" in product :
                if data[1] == product["TAG"] :
                    if product['typeRecupEMonitoring'] == "tafMin" :
                        recup = data[4]
                    else :
                        if product['typeRecupEMonitoring'] == "tafMax" :
                            recup = data[5]
                        else :
                            if product['typeRecupEMonitoring'] == "tafVal" :
                                recup = data[3]
                            else :
                                recup = data[5] - data[4]
                    req = "https://fr-couvinove301:3102/Measure?EntryDate="+ str(hier) + "&Value=" + str(recup) + " &ProductId= " + str(product['Id']) + "&ProducerId=0"
                    response = requests.put(req, headers = {"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6ImZmcmV6cXNrejdmIiwiaWF0IjoxNjg2NzM1MTEyfQ.uk7IdzysJioPG3pdV2w99jNPHq5Uj6CWpIDiZ_WGhY0"}, verify=False)

# Fermeture du curseur et de la connexion
curseur.close()

connexion.close()

#Rondier
#Boucle sur les sites pour insérer les valeur site par site
for site in listeSites['data'] :
    print(str(site['id']))
    #Récupération de la liste des produits avec un element de récupération rondier dans chaque usine
    req = "https://fr-couvinove301:3102/getProductsWithElementRondier?idUsine=" + str(site['id'])
    response = requests.get(req, headers = {"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6ImZmcmV6cXNrejdmIiwiaWF0IjoxNjg2NzM1MTEyfQ.uk7IdzysJioPG3pdV2w99jNPHq5Uj6CWpIDiZ_WGhY0"}, verify=False)
    listProductsRondier = response.json()
    listProductsRondier = listProductsRondier["data"]

    #On boucle sur les produits et les données imagine data
    for product in listProductsRondier :
        req = "https://fr-couvinove301:3102/valueElementDay?id=" + str(product['idElementRondier']) + "&date=" + str(hierRondier)
        response = requests.get(req, headers = {"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6ImZmcmV6cXNrejdmIiwiaWF0IjoxNjg2NzM1MTEyfQ.uk7IdzysJioPG3pdV2w99jNPHq5Uj6CWpIDiZ_WGhY0"}, verify=False)
        value = response.json()
        value = value['data']
        for val in value :
            print(val['value'])
            req = "https://fr-couvinove301:3102/Measure?EntryDate="+ str(hier) + "&Value=" + str(val['value']) + " &ProductId= " + str(product['Id']) + "&ProducerId=0"
            # response = requests.put(req, headers = {"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6ImZmcmV6cXNrejdmIiwiaWF0IjoxNjg2NzM1MTEyfQ.uk7IdzysJioPG3pdV2w99jNPHq5Uj6CWpIDiZ_WGhY0"}, verify=False)

