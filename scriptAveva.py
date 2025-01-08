import requests
from requests_ntlm import HttpNtlmAuth
from datetime import datetime, timedelta
import warnings

#Création d'un fichier de log
dateActuelle = datetime.now()
format_date = "%d %B %Y à %Hh%M"
dateFormatee = dateActuelle.strftime(format_date)

# dateHeure = "logAveva" + str(dateFormatee)  + ".txt"
# dateHeure = dateHeure.replace(" ","_").replace(":","-")

# f = open(dateHeure, "x")

headers = {"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6ImZmcmV6cXNrejdmIiwiaWF0IjoxNjg2NzM1MTEyfQ.uk7IdzysJioPG3pdV2w99jNPHq5Uj6CWpIDiZ_WGhY0"}
#Disable warnings
warnings.filterwarnings("ignore")

#Récupération de la date de la veille
#TODO : Attention il faut gérer les heures UTC
#UTC+1 => 00h00 et 23h59 correspond UTC => 23h00 la veille et 23h
#UTC+2 => 00h00 et 23h59 correspond UTC => 22h00 la veille et 22h
aujourdhui = datetime.now().date()
hier = aujourdhui - timedelta (days=1)
hierAvevaDebut = f'{hier}' + "T00:00:00Z"
hierAvevaFin = f'{hier}' + "T23:59:59Z"
#derniere valeur de la journée
#Attention on a des heures UTC => 22h59 en UTC = 23h59 en UTC+1 (heure française)
#Prévoir de mettre 21h59 en heure d'été quand on aura UTC+2
dernierAvevaDebut = f'{hier}' + "T22:59:50Z"
dernierAvevaFin = f'{hier}' + "T22:59:59Z"

print("Debut du script Aveva Le " + str(aujourdhui)  + "\n")

# récupération de la liste des sites CAP Exploitation
req = "https://fr-couvinove301:3100/sitesAveva"
response = requests.get(req, headers = headers, verify=False)
listeSites = response.json()

#récupération de la liste des conversion dans CAP Exploitation
req = "https://fr-couvinove301:3100/getConversions"
response = requests.get(req, headers = headers, verify=False)
listConversions = response.json()
listConversions = listConversions["data"]

# #Boucle sur les sites pour insérer les valeur site par site
for site in listeSites['data'] :

    ############TAG CLASSIQUE
    #Récupération de la liste des produits avec un TAG dans chaque usine (sauf ceux pour lesquelles ont veut seulement la dernière valeur du jour)
    req = "https://fr-couvinove301:3100/getProductsWithTagClassique?idUsine=" + str(site['id'])
    response = requests.get(req, headers = headers, verify=False)
    listProducts = response.json()
    listProducts = listProducts["data"]

    for product in listProducts :

        #Récupération des données du jour 
        req = str(site['ipAveva']) +"/Historian/v2/AnalogSummary?$filter=FQN+eq+'"+product["TAG"]+"'+and+StartDateTime+ge+"+ hierAvevaDebut+"+and+EndDateTime+le+"+hierAvevaFin+"&resolution=86400000"
        print(req)
        response = requests.get(req, auth=HttpNtlmAuth('capexploitation','X5p9UarUm56H8d'), verify=False)
        print("boucle1")
        print(response)
        listData = response.json()
        print(listData['value'])
        # #Si on l'api nous retourne une valeur, on créé une mesure
        if len(listData['value']) != 0:
            #if(product["TAG"] == 'P_Active/MESURE.U'): 
                #print(listData['value'][0])
            if product['typeRecupEMonitoring'] == "tafMin" and listData['value'][0]['Minimum'] != 'NaN':
                recup = listData['value'][0]['Minimum']
            else :
                if product['typeRecupEMonitoring'] == "tafMax" and listData['value'][0]['Maximum'] != 'NaN' :
                    recup =listData['value'][0]['Maximum']
                else :
                    if product['typeRecupEMonitoring'] == "cumul" and listData['value'][0]['Maximum'] != 'NaN' and listData['value'][0]['Minimum'] != 'NaN' :
                        #recup = data[5] - data[4]
                        recup = listData['value'][0]['Maximum'] - listData['value'][0]['Minimum']
                    else :
                        recup = listData['value'][0]['Average']

            #Si l'unité Aveva est différente de l'unité CAP Exploitation
            if "Unit" in listData['value'][0] :
                if product['Unit'] != listData['value'][0]['Unit'] :
                    #On parcourt la liste des conversion de CAP Exploitation
                    for conversion in listConversions :
                        count = 0
                        #Si on a une conversion dont l'unité de base est celle d'Aveva et dont l'unité cible est celle de CAP Exploitation
                        if listData['value'][0]['Unit'].lower() == conversion['uniteBase'].lower() and product['Unit'].lower() == conversion['uniteCible'].lower() :
                            #On récupère l'opérateur de la conversion qui est le premier caractère
                            operateur = conversion['conversion'][0]
                            #On récupère la valeur en int du calcul
                            valeur = int(conversion['conversion'][1:])
                            count = count + 1
                            #print(str(recup)  + "\n")
                            #On regarde quel opérateur est utilisé et on fait le calcul
                            if operateur == "*" :
                                recup = recup * valeur
                            else :
                                if operateur == "/" :
                                    recup = recup / valeur
                            #print(str(recup)  + "\n")
                    # if count == 0 :
                        # f.write("Unite Aveva : " +listData['value'][0]['Unit']  + "\n")
                        # f.write("Unite CAP : " + product['Unit']  + "\n")
                        # f.write(product['Name']  + "\n")
                        # f.write("*******************************"  + "\n")

            #ATTENTION => A automatiser
            #Permet de faire *24 sur un compteur qui est un débit mètre ou autre et qui renvoi la moyenne
            if(product["TAG"] == 'P_Active/MESURE.U' or product["TAG"] == '0MKA60CE100ET/MESURE.U' or product["TAG"] == '0MKA60CE108/MESURE.U' or product["TAG"] == '1LBA10CF901FT/MESURE.U' or product["TAG"] == '2LBA10CF901FT/MESURE.U' or product["TAG"] == '3LBA10CF001FT/MESURE.U'): 
                recup = recup * 24
            if(recup != 'NaN'):
                req = "https://fr-couvinove301:3100/Measure?EntryDate="+ str(hier) + "&Value=" + str(recup) + " &ProductId= " + str(product['Id']) + "&ProducerId=0"
                #print(req)
                response = requests.put(req, headers = headers, verify=False)


    ##########TAG POUR RECUPERATION DERNIERE VALEUR JOUR
    #Récupération de la liste des produits avec un TAG dans chaque usine (UNIQUEMENT ceux pour lesquelles ont veut seulement la dernière valeur du jour)
    req = "https://fr-couvinove301:3100/getProductsWithTagDerniere?idUsine=" + str(site['id'])
    response = requests.get(req, headers = headers, verify=False)
    listProducts = response.json()
    listProducts = listProducts["data"]

    for product in listProducts :

        #Récupération de la dernière données du jour
        req = str(site['ipAveva']) +"/Historian/v2/AnalogSummary?$filter=FQN+eq+'"+product["TAG"]+"'+and+StartDateTime+ge+"+dernierAvevaDebut+"+and+EndDateTime+le+"+dernierAvevaFin+"&RetrievalMode=Cyclic"
        print(req)
        response = requests.get(req, auth=HttpNtlmAuth('capexploitation','X5p9UarUm56H8d'), verify=False)
        print("boucle2")
        print(response)
        listData = response.json()
        #print(listData)
        #Si on l'api nous retourne une valeur, on créé une mesure
        if len(listData['value']) != 0:
            recup = listData['value'][0]['Average']
            if(recup != 'NaN'):
                req = "https://fr-couvinove301:3100/Measure?EntryDate="+ str(hier) + "&Value=" + str(recup) + " &ProductId= " + str(product['Id']) + "&ProducerId=0"
                #print(req)
                response = requests.put(req, headers = headers, verify=False)

print("Fin du script !"  + "\n")
