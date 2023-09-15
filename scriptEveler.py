import requests
import json
from pprint import pprint
from datetime import datetime, timedelta
import warnings
#Disable warnings
warnings.filterwarnings("ignore")

URL = "https://api.eveler.pro/api/client"
TOKEN = "QrdNdoeyFcTVnrj0zWFR3DsiGuH3POuzIRzOZm2Sezk"
SECRET = "6HBSgxtvYRYWHEDgcuhH75v1U8OnkY9RLQwAhCVhQG8"
headers = {"accept": "application/json"}

#Connexion : récupération du token pour l'API EVELER
#Le token est valable 1h donc on le génére à chaque fois
r = requests.post(URL + "/auth/login", params={"token": TOKEN, "secret": SECRET}, headers=headers, verify=False)
if r.status_code == 200 and r.json()["success"] is True:
    api_token = r.json()["data"]["token"]
    #print("Requete HTTP OK : API Token = ", api_token)
    headers["Authorization"] = api_token
else:
    print("Error : code retour HTTP = {}".format(r.status_code))

#Récupération de la date de la veille
aujourdhui = datetime.now().date()
hier = aujourdhui - timedelta (days=1)

#RECUPERATION de la liste des produits CAP Exploitation avec un TAG EVELER
req = "https://fr-couvinove301:3100/ProductEveler"
response = requests.get(req, headers = {"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6ImZmcmV6cXNrejdmIiwiaWF0IjoxNjg2NzM1MTEyfQ.uk7IdzysJioPG3pdV2w99jNPHq5Uj6CWpIDiZ_WGhY0"}, verify=False)
listeProducts = response.json()
listeProducts = listeProducts['data']
#On boucle sur les produits
for p in listeProducts:
    #On récupère l'id du produit CAP Exploitation
    idProduct = p["Id"]
    #On récupérer l'id du compteur car un TAG est au Format EVELER:id:energie
    idCompteur = p["TAG"].split(":")[1]
    #On récupère l'energie et on l'écrit correctement
    typeEnergie = p["TAG"].split(":")[2]
    #On initialise la valeur à insérer à 0
    valueToInsert = 0.0

    if typeEnergie == "ACTIVE":
        typeEnergie = "active"
    else:
        typeEnergie = "reactive+"
    
    print("**************", idProduct, p["Name"], idCompteur, typeEnergie)

    #REQ EVELER pour récupérer les points 5 min du compteurs entre 2 points
    _id_human = idCompteur
    channel="power:"+typeEnergie
    #channel="power:reactive+"
    start=hier # Attention UTC
    end=aujourdhui# Attention UTC
    complete_url = f"{URL}/meter/{_id_human}/data/{channel}/{start}/{end}"
    r = requests.get(complete_url, headers=headers, verify=False)
    if r.status_code == 200 and r.json()['success'] is True:
        json_data = r.json()['data']
        listValuesPoint5min = json_data['values']
        unit = json_data['unit']
        #print("Requete HTTP OK : nombre d'attributs = ", len(json_data))
        #pprint(json_data)
        #pprint(unit)
        #boucle ici pour avoir la valeur
        #pprint(listValuesPoint5min)
        #On boucle sur les point 5 min pour faire la somme
        for data in listValuesPoint5min:
            valueToInsert = valueToInsert + data['value']
        #On divise ensuite la valeur par 12 000 pour avoir la conversion en Mwh ou Mvarh
        valueToInsert = valueToInsert / 12000
        #print("total : ",valueToInsert)

    else:
        print("Error : code retour HTTP = {}".format(r.status_code))

    #On insére la valeur dans CAP Exploitation
    req = "https://fr-couvinove301:3100/Measure?EntryDate="+ str(hier) + "&Value=" + str(valueToInsert) + " &ProductId= " + str(idProduct) + "&ProducerId=0"
    response = requests.put(req, headers = {"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6ImZmcmV6cXNrejdmIiwiaWF0IjoxNjg2NzM1MTEyfQ.uk7IdzysJioPG3pdV2w99jNPHq5Uj6CWpIDiZ_WGhY0"}, verify=False)
    print(response)
    


## Cette API permet de lister tous les compteurs de votre périmètre
## l'information meta.computed.last_data indique la date de la dernière
## données du compteur
#complete_url = f"{URL}/meters"
#r = requests.get(complete_url, headers=headers)
##si retour OK de la req
#if r.status_code == 200 and r.json()["success"] is True:
#    json_data = r.json()['data']
#    print("Requete HTTP OK : nombre de compteurs = ", len(json_data))

##On boucle sur les compteurs et on affiche les infos
#    for m in json_data:
#        print(
#            "Meter ",
#            m["_id_human"],
#            m["name"],
#            m["rae"] if "rae" in m else "?",
#            m["meta"]["computed"]["last_data"]
#            if (
#                    "meta" in m and
#                    "computed" in m["meta"] and
#                    "last_data" in m["meta"]["computed"]
#            ) else "?"
#        )
#else:
#    print("Error : code retour HTTP = {}".format(r.status_code))

#print("//*********************SAINT SAULVE*************************//")

##Récupérer les compteurs par rapport au RAE du site => Saint Saulve
#filters = {"actif": True, "rae": "30000120589384"}
#r = requests.get(URL + "/meters", params={"filter": json.dumps(filters)}, headers=headers)
#if r.status_code == 200 and r.json()["success"] is True:
#    json_data = r.json()["data"]
#    print("Requete HTTP OK : nombre de compteurs = ", len(json_data))

#    for m in json_data:
#        print("Meter ", m["_id_human"], m["name"])
#else:
#    print("Error : code retour HTTP = {}".format(r.status_code))

#print("//*********************SAINT SAULVE - soutirage*************************//")

##Récupérer les attributs d'un compteur par rapport à son id
#_id_human = 35236
#r = requests.get(URL + "/meter/" + str(_id_human), headers=headers)
#if r.status_code == 200 and r.json()["success"] is True:
#    json_data = r.json()["data"]
#    print("Requete HTTP OK : nombre d'attributs = ", len(json_data))
#    pprint(json_data["meta"]["runtime_computed"])
#else:
#    print("Error : code retour HTTP = {}".format(r.status_code))

#print("//*********************SAINT SAULVE - injection - relevé*************************//")

## /meter/{meter_id}/data/{channel}/{start_date}/{end_date}
#Récupérer les valeurs d'un compteur entre 2 dates
##_id_human=35346
#_id_human = 35236
#channel="power:active"
#channel="power:reactive+"
#start="2023-07-11" # Attention UTC
#end="2023-07-12"# Attention UTC
#complete_url = f"{URL}/meter/{_id_human}/data/{channel}/{start}/{end}"
#r = requests.get(complete_url, headers=headers, verify=False)
#if r.status_code == 200 and r.json()['success'] is True:
#    json_data = r.json()['data']
#    print("Requete HTTP OK : nombre d'attributs = ", len(json_data))
#    pprint(json_data)
#else:
#    print("Error : code retour HTTP = {}".format(r.status_code))