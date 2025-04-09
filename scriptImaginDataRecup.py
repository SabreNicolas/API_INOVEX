import requests
import mysql.connector
from datetime import datetime, timedelta
import warnings
import re
#Disable warnings
warnings.filterwarnings("ignore")

headers = {"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6ImZmcmV6cXNrejdmIiwiaWF0IjoxNjg2NzM1MTEyfQ.uk7IdzysJioPG3pdV2w99jNPHq5Uj6CWpIDiZ_WGhY0"}

#Récupération de la date de la veille
aujourdhui = datetime.now().date()
hier = input("Saisissez la date que vous souhaitez (DD/MM/YYYY)")
hier = datetime.strptime(hier, "%d/%m/%Y").date()
hierRondier = f'{hier:%d/%m/%Y}'

print("Début du script ImaginData Le " + str(aujourdhui))

#récupération de la liste des sites CAP Exploitation
req = "https://fr-couvinove301:3100/sites"
response = requests.get(req, headers = headers, verify=False)
listeSites = response.json()

#récupération de la liste des conversion dans CAP Exploitation
req = "https://fr-couvinove301:3100/getConversions"
response = requests.get(req, headers = headers, verify=False)
listConversions = response.json()
listConversions = listConversions["data"]

print("\n\n\nDébut du script Rondier!")
#Rondier
#Boucle sur les sites pour insérer les valeur site par site
for site in listeSites['data'] :
    print("site : "+str(site['id']))
    #Récupération de la liste des produits avec un element de récupération rondier dans chaque usine
    req = "https://fr-couvinove301:3100/getProductsWithElementRondier?idUsine=" + str(site['id'])
    response = requests.get(req, headers = headers, verify=False)
    listProductsRondier = response.json()
    listProductsRondier = listProductsRondier["data"]

    #On boucle sur les produits et les données rondier
    for product in listProductsRondier :
        req = "https://fr-couvinove301:3100/valueElementDay?id=" + str(product['idElementRondier']) + "&date=" + str(hierRondier)
        response = requests.get(req, headers = headers, verify=False)
        value = response.json()
        value = value['data']
        for val in value :
            if val['value'] != '/' and re.match(r'^\d+[.]?\d*$',val['value']) != None:
                #print(val['value'] + "\n")
                req = "https://fr-couvinove301:3100/Measure?EntryDate="+ str(hier) + "&Value=" + str(val['value']) + " &ProductId= " + str(product['Id']) + "&ProducerId=0"
                response = requests.put(req, headers = headers, verify=False)
            else :
                print("On n'a pas inséré : "+val['value'] + "\n")

print("Fin du script Rondier !")


print("Début du script ImaginData Le " + str(aujourdhui)  + "\n")
#Connexion à la base de données ImagineData
try:
    connexion = mysql.connector.connect(
        host="imagindata.com",
        user="siege",
        password="ml!25dmSg:85fGas",
        database="siege",
        port="33060",
        ssl_disabled=True
    )
    if connexion.is_connected():
        print("Connexion ImaginData OK")
except mysql.connector.Error as e:
    print(e)

# Création du curseur
curseur = connexion.cursor()
#Boucle sur les sites pour insérer les valeur site par site
for site in listeSites['data'] :

    # Récupération des produits avec un TAG dans chaque usine dans ImaginData
    requete = "SELECT * FROM tagflow JOIN site ON site.SitId = tagflow.FkSitId WHERE site.SitName = '" + site['localisation'] + "' AND tafUtsTs = '"+ str(hier) +"';"
    curseur.execute(requete)
    listData = curseur.fetchall()

    #Récupération de la liste des produits avec un TAG dans chaque usine dans CAP Exploitation
    req = "https://fr-couvinove301:3100/getProductsWithTagClassique?idUsine=" + str(site['id'])
    response = requests.get(req, headers = headers, verify=False)
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
                    if rep != [] :
                        unit = rep[0][2]
                    else : unit = product['Unit']

                    #Si l'unité Imagin data est différente de l'unité CAP Exploitation
                    if product['Unit'] != unit :
                        count = 0
                        #On parcourt la liste des conversion de CAP Exploitation
                        for conversion in listConversions :
                            #Si on a une conversion dont l'unité de base est celle d'imaginData et dont l'unité cible est celle de CAP Exploitation
                            if unit.lower() == conversion['uniteBase'].lower() and product['Unit'].lower() == conversion['uniteCible'].lower() :
                                count = count + 1
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
                        #if count == 0 :
                            #print("Unite ImaginData : " +unit)
                            #print("Unite CAP : " + product['Unit'])
                            #print(product['Name'])
                            #print("*******************************")
                    #On insère ensuite la valeur en base de donnée
                    req = "https://fr-couvinove301:3100/Measure?EntryDate="+ str(hier) + "&Value=" + str(recup) + " &ProductId= " + str(product['Id']) + "&ProducerId=0"
                    response = requests.put(req, headers = headers, verify=False)

# Fermeture du curseur et de la connexion
curseur.close()

connexion.close()
print("Déconnexion de la base de données ImaginData")

print("Fin du script Imagindata !"  + "\n")