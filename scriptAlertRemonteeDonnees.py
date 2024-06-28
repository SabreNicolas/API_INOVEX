#Le but de ce script est de vérifier si la remontée des données IMAGINDATA se fait bien
#Si nous n'avons pas de données pour la veille et l'avant veille, on envoi un mail pour informer les personnes nécessaires
import requests
from O365 import Message, MSGraphProtocol, Account
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import warnings
#Disable warnings
warnings.filterwarnings("ignore")

#Préparation du mail
##Récupération des données du SMTP dans .env
load_dotenv()
clientSMTP = os.getenv('CLIENT_ID')
secretSMTP = os.getenv('SECRET_KEY')
##Fin récupération données .env

#protocol = MSGraphProtocol()
#o365_auth = (userSMTP,pwdSMTP)
#m = Message(auth=o365_auth, protocol=protocol)
credentials = (clientSMTP, secretSMTP)
account = Account(credentials, auth_flow_type='credentials', tenant_id='my-tenant-id')
if account.authenticate():
   print('Authenticated!')
#account.authenticate()
m = account.new_message()
m.to.add('nsabre@kerlan-info.fr')
m.subject= 'Les données ImaginData ne remontent plus depuis 48h....'
body = "<h2>Nous avons un problème pour les TAGs suivants : </h2> \n"
#FIN Préparation du mail

# f = open(dateHeure, "x")
headers = {"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6ImZmcmV6cXNrejdmIiwiaWF0IjoxNjg2NzM1MTEyfQ.uk7IdzysJioPG3pdV2w99jNPHq5Uj6CWpIDiZ_WGhY0"}

#Récupération de la date de la veille
aujourdhui = datetime.now().date()
hier = aujourdhui - timedelta (days=1)
#Récupération de la date de l'avant veille
avantHier = aujourdhui - timedelta (days=2)

nbTag = 0

print("Début du script de verif de remontée des TAGS (ImaginData & EVELER) Le " + str(aujourdhui)  + "\n")

#récupération de la liste des sites CAP Exploitation
req = "https://fr-couvinove301:3100/sites"
response = requests.get(req, headers = headers, verify=False)
listeSites = response.json()

#Boucle sur les sites pour insérer les valeur site par site
for site in listeSites['data'] :
    nbTag = 0

    body = body +"//*********** "+str(site['localisation']).upper()+" ***********//" + "\n"

    #Récupération de la liste des produits avec un TAG dans chaque usine dans CAP Exploitation
    req = "https://fr-couvinove301:3100/getProductsWithTag?idUsine=" + str(site['id'])
    response = requests.get(req, headers = headers, verify=False)
    listProducts = response.json()
    listProducts = listProducts["data"]

    #print(listProducts)

    #On boucle sur les produits pour vérifier si on trouve des données
    for product in listProducts :
        nbTag = nbTag+1

        #On regarde si on a une valeur à hier
        req = "https://fr-couvinove301:3100/ValuesProducts/"+ str(product['Id']) +"/"+ str(hier)
        response = requests.get(req, headers = headers, verify=False)
        valueHier = response.json()
        valueHier = valueHier["data"]
        if(len(valueHier) > 0) :
            valueHier = valueHier[0]
        else :
            valueHier = {'Value': "N/A"}
        #On regarde si on a une valeur à avant hier
        req = "https://fr-couvinove301:3100/ValuesProducts/"+ str(product['Id']) +"/"+ str(avantHier)
        response = requests.get(req, headers = headers, verify=False)
        valueAvantHier = response.json()
        valueAvantHier = valueAvantHier["data"]
        if(len(valueAvantHier) > 0) :
            valueAvantHier = valueAvantHier[0]
        else :
            valueAvantHier = {'Value': "N/A"}

        #Si on a pas de valeurs sur les 2 précédents jours -> on lance une alert par mail
        if(valueHier["Value"] == "N/A" and valueAvantHier["Value"] == "N/A") :
            body = body + "*Pas de Valeur* "+str(site['localisation']).upper()+" - "+str(product['Name'])+" - "+str(product['TAG'])+ "\n"
        #Idem si on a 0 depuis 2 jours -> on précise que c'est à 0 depuis 2 jours
        elif(valueHier["Value"] == 0 and valueAvantHier["Value"] == 0) :
            body = body + "*Valeurs à 0* "+str(site['localisation']).upper()+" - "+str(product['Name'])+" - "+str(product['TAG'])+ "\n"

    body = body + "****** Nombre de TAGs sur le site de "+str(site['localisation']).upper()+" -> " + str(nbTag) + "\n"

    body = body + "//*********** FIN "+str(site['localisation']).upper()+" ***********//" + "\n\n"

m.body = body
if(len(body) > 60) :
    print("envoi du mail : "+body)
    m.send()

print("Fin du script de verif des remontées Imagindata !"  + "\n")
