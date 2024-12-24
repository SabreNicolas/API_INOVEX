import requests
import mysql.connector
from datetime import datetime, timedelta
import warnings
import re

#Disable warnings
warnings.filterwarnings("ignore")

#Création d'un fichier de log
dateActuelle = datetime.now()
format_date = "%d %B %Y à %Hh%M"
dateFormatee = dateActuelle.strftime(format_date)

dateHeure = "logImaginData" + str(dateFormatee)  + ".txt"
dateHeure = dateHeure.replace(" ","_").replace(":","-")

# f = open(dateHeure, "x")
headers = {"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6ImZmcmV6cXNrejdmIiwiaWF0IjoxNjg2NzM1MTEyfQ.uk7IdzysJioPG3pdV2w99jNPHq5Uj6CWpIDiZ_WGhY0"}

#Récupération de la date de la veille
aujourdhui = datetime.now().date()
hier = aujourdhui - timedelta (days=1)
hierRondier = f'{hier:%d/%m/%Y}'

print("Début du script ImaginData Le " + str(aujourdhui)  + "\n")

#récupération de la liste des sites CAP Exploitation
req = "https://fr-couvinove301:3100/sites"
response = requests.get(req, headers = headers, verify=False)
listeSites = response.json()

#récupération de la liste des conversion dans CAP Exploitation
req = "https://fr-couvinove301:3100/getConversions"
response = requests.get(req, headers = headers, verify=False)
listConversions = response.json()
listConversions = listConversions["data"]


print("\n\n\nDébut du script Rondier!" + "\n")
#Rondier
#Boucle sur les sites pour insérer les valeur site par site
for site in listeSites['data'] :
    print(str(site['id'])  + "\n")
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
            if val['value'] != '/' and re.match(r'^\d+(\.\d+)?$',val['value']) == True:
                print(val['value'] + "\n")
                req = "https://fr-couvinove301:3100/Measure?EntryDate="+ str(hier) + "&Value=" + str(val['value']) + " &ProductId= " + str(product['Id']) + "&ProducerId=0"
                response = requests.put(req, headers = headers, verify=False)

print("Fin du script Rondier !")



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
                        # if count == 0 :
                            # f.write("Unite ImaginData : " +unit  + "\n")
                            # f.write("Unite CAP : " + product['Unit']  + "\n")
                            # f.write(product['Name']  + "\n")
                            # f.write("*******************************"  + "\n")
                    #On insère ensuite la valeur en base de donnée
                    req = "https://fr-couvinove301:3100/Measure?EntryDate="+ str(hier) + "&Value=" + str(recup) + " &ProductId= " + str(product['Id']) + "&ProducerId=0"
                    response = requests.put(req, headers = headers, verify=False)

# Fermeture du curseur et de la connexion
curseur.close()

connexion.close()

print("Fin du script Imagindata !"  + "\n")
