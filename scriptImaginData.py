import requests
import mysql.connector
from datetime import datetime, timedelta

#Récupération de la date de la veille
aujourdhui = datetime.now().date()
hier = aujourdhui - timedelta (days=1)
hierRondier = f'{hier:%d/%m/%Y}'


#récupération de la liste des sites CAP Exploitation
req = "https://fr-couvinove301:3100/sites"
response = requests.get(req, headers = {"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6ImZmcmV6cXNrejdmIiwiaWF0IjoxNjg2NzM1MTEyfQ.uk7IdzysJioPG3pdV2w99jNPHq5Uj6CWpIDiZ_WGhY0"}, verify=False)
listeSites = response.json()

#récupération de la liste des conversion dans CAP Exploitation
req = "https://fr-couvinove301:3100/getConversions"
response = requests.get(req, headers = {"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6ImZmcmV6cXNrejdmIiwiaWF0IjoxNjg2NzM1MTEyfQ.uk7IdzysJioPG3pdV2w99jNPHq5Uj6CWpIDiZ_WGhY0"}, verify=False)
listConversions = response.json()
listConversions = listConversions["data"]

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

    # Récupération des produits avec un TAG dans chaque usine dans ImaginData
    requete = "SELECT * FROM tagflow JOIN site ON site.SitId = tagflow.FkSitId WHERE site.SitName = '" + site['localisation'] + "' AND tafUtsTs = '"+ str(hier) +"';"
    curseur.execute(requete)
    listData = curseur.fetchall()

    #Récupération de la liste des produits avec un TAG dans chaque usine dans CAP Exploitation
    req = "https://fr-couvinove301:3100/getProductsWithTag?idUsine=" + str(site['id'])
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
                            if product['typeRecupEMonitoring'] == "cumul" :
                                #recup = data[5] - data[4]
                                recup = data[6]
                            else :
                                recup = data[3]

                    # Récupération de l'unité dans imagin Data
                    requete = "SELECT * FROM tags WHERE TagName = '" + data[1] + "'"
                    curseur.execute(requete)
                    rep = curseur.fetchall()
                    unit = rep[0][2]

                    #Si l'unité Imagin data est différente de l'unité CAP Exploitation
                    if product['Unit'] != unit :
                        #On parcourt la liste des conversion de CAP Exploitation
                        for conversion in listConversions :
                            #Si on a une conversion dont l'unité de base est celle d'imaginData et dont l'unité cible est celle de CAP Exploitation
                            if unit == conversion['uniteBase'] and product['Unit'] == conversion['uniteCible'] :
                                #On récupère l'opérateur de la conversion qui est le premier caractère
                                operateur = conversion['conversion'][0]
                                #On récupère la valeur en int du calcul
                                valeur = int(conversion['conversion'][1:])
                                #On regarde quel opérateur est utilisé et on fait le calcul
                                if operateur == "*" :
                                    recup = recup * valeur
                                else :
                                    if operateur == "/" :
                                        recup = recup / valeur
                    #On insère ensuite la valeur en base de donnée
                    req = "https://fr-couvinove301:3100/Measure?EntryDate="+ str(hier) + "&Value=" + str(recup) + " &ProductId= " + str(product['Id']) + "&ProducerId=0"
                    response = requests.put(req, headers = {"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6ImZmcmV6cXNrejdmIiwiaWF0IjoxNjg2NzM1MTEyfQ.uk7IdzysJioPG3pdV2w99jNPHq5Uj6CWpIDiZ_WGhY0"}, verify=False)

# Fermeture du curseur et de la connexion
curseur.close()

connexion.close()

#Rondier
#Boucle sur les sites pour insérer les valeur site par site
for site in listeSites['data'] :
    print(str(site['id']))
    #Récupération de la liste des produits avec un element de récupération rondier dans chaque usine
    req = "https://fr-couvinove301:3100/getProductsWithElementRondier?idUsine=" + str(site['id'])
    response = requests.get(req, headers = {"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6ImZmcmV6cXNrejdmIiwiaWF0IjoxNjg2NzM1MTEyfQ.uk7IdzysJioPG3pdV2w99jNPHq5Uj6CWpIDiZ_WGhY0"}, verify=False)
    listProductsRondier = response.json()
    listProductsRondier = listProductsRondier["data"]

    #On boucle sur les produits et les données imagine data
    for product in listProductsRondier :
        req = "https://fr-couvinove301:3100/valueElementDay?id=" + str(product['idElementRondier']) + "&date=" + str(hierRondier)
        response = requests.get(req, headers = {"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6ImZmcmV6cXNrejdmIiwiaWF0IjoxNjg2NzM1MTEyfQ.uk7IdzysJioPG3pdV2w99jNPHq5Uj6CWpIDiZ_WGhY0"}, verify=False)
        value = response.json()
        value = value['data']
        for val in value :
            print(val['value'])
            req = "https://fr-couvinove301:3100/Measure?EntryDate="+ str(hier) + "&Value=" + str(val['value']) + " &ProductId= " + str(product['Id']) + "&ProducerId=0"
            # response = requests.put(req, headers = {"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6ImZmcmV6cXNrejdmIiwiaWF0IjoxNjg2NzM1MTEyfQ.uk7IdzysJioPG3pdV2w99jNPHq5Uj6CWpIDiZ_WGhY0"}, verify=False)

