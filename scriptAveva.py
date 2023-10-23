import requests
import mysql.connector
from datetime import datetime, timedelta
import warnings
#Disable warnings
warnings.filterwarnings("ignore")

#Récupération de la date de la veille
aujourdhui = datetime.now().date()
hier = aujourdhui - timedelta (days=1)
hierAvevaDebut = f'{hier}' + "T00:00:00Z"
hierAvevaFin = f'{hier}' + "T23:59:00Z"

# récupération de la liste des sites CAP Exploitation
req = "https://fr-couvinove301:3100/sites"
response = requests.get(req, headers = {"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6ImZmcmV6cXNrejdmIiwiaWF0IjoxNjg2NzM1MTEyfQ.uk7IdzysJioPG3pdV2w99jNPHq5Uj6CWpIDiZ_WGhY0"}, verify=False)
listeSites = response.json()
# #Boucle sur les sites pour insérer les valeur site par site
for site in listeSites['data'] :

    #Récupération de la liste des produits avec un TAG dans chaque usine
    req = "https://fr-couvinove301:3100/getProductsWithTag?idUsine=" + str(site['id'])
    response = requests.get(req, headers = {"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6ImZmcmV6cXNrejdmIiwiaWF0IjoxNjg2NzM1MTEyfQ.uk7IdzysJioPG3pdV2w99jNPHq5Uj6CWpIDiZ_WGhY0"}, verify=False)
    listProducts = response.json()
    listProducts = listProducts["data"]

    for product in listProducts :

        #Récupération des données du jour 
        req = "https://online.wonderware.eu/apis/Historian/v2/AnalogSummary?$filter=FQN+eq+'"+product["TAG"]+"'+and+StartDateTime+ge+"+ hierAvevaDebut+"+and+EndDateTime+le+"+hierAvevaFin+"&resolution=86400000"
        response = requests.get(req, headers = {"Authorization":"Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImZmNTM0NWZiLWM0NTctNDkyNy04ZDYxLWNhN2ZhNmExYWU4MSJ9.eyJ0eXBlIjoic2VydmljZSIsInZlcnNpb24iOiIyLjAiLCJ0ZW5hbnRpZCI6ImU4MjM5ZTI0LTdiMDEtNDJmYS1hMzliLTBkNTMwZGEwNTYzZiIsInNpaWQiOiI3OGU4M2VjMC0xZjk2LTQ2YTMtODhmMC0zODIwZmY1YWZhNDgiLCJqdGkiOiJlYTIyNmE2OC1lMjM4LTRiOWUtYmRjMy0yZWQyMTM0MDA4NDkiLCJpc3MiOiJwcm9vZm9maWRlbnRpdHlzZXJ2aWNlIn0.SXVjR8IsKeFPigMNQHm-cEm17BedswuEwdDomh4juEpmV0drgjvZlLYTThQpG9LcgHID8XROZ0kNQpZ5aVzYfdRPV-FG_eW_r_tVCa1QKT3jk3e_Yn34jygXEYJQv0ghpMRhwqHn2I7ksrqHVYUFt2L8uZ8JNwoUWnCgQApfc_AKajJaZndwPk82TnulyR51HuPolVOrlreAgcfwJ3y6pZSGbqPss8KzqEyZJ8aMNxa4dI6yVR0By0nao_pTKTkgPyUjBPsffEMmcwV9z97iq8SGF42pKG8nycTaG0Buc20q8p4JAY0QhA-AcxBE-loL_zk7T9Av532PWUqJtSBO5g"}, verify=False)
        listData = response.json()

        #Si on l'api nous retourne une valeur, on créé une mesure
        if len(listData['value']) != 0:
            if product['typeRecupEMonitoring'] == "tafMin" :
                recup = listData['value'][0]['Minimum']
            else :
                if product['typeRecupEMonitoring'] == "tafMax" :
                    recup =listData['value'][0]['Maximum']
                else :
                    if product['typeRecupEMonitoring'] == "cumul" :
                        #recup = data[5] - data[4]
                        recup = listData['value'][0]['Maximum'] - listData['value'][0]['Minimum']
                    else :
                        recup = listData['value'][0]['Average']

            req = "https://fr-couvinove301:3100/Measure?EntryDate="+ str(hier) + "&Value=" + str(recup) + " &ProductId= " + str(product['Id']) + "&ProducerId=0"
            response = requests.put(req, headers = {"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6ImZmcmV6cXNrejdmIiwiaWF0IjoxNjg2NzM1MTEyfQ.uk7IdzysJioPG3pdV2w99jNPHq5Uj6CWpIDiZ_WGhY0"}, verify=False)


