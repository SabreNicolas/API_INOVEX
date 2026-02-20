import requests
import warnings
from datetime import datetime, timedelta

#Disable warnings
warnings.filterwarnings("ignore")

aujourdhui = datetime.now().date()

req = "https://fr-couvinove301:3100/getEquipeQuart?idUsine=7&quart=2&date=" + str(aujourdhui)
response = requests.get(req, headers = {"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6ImZmcmV6cXNrejdmIiwiaWF0IjoxNjg2NzM1MTEyfQ.uk7IdzysJioPG3pdV2w99jNPHq5Uj6CWpIDiZ_WGhY0"}, verify=False)
listId = response.json()
id = listId['data'][0]['id']

req = "https://fr-couvinove301:3100/deleteAffectationEquipe/" + str(id)
response = requests.delete(req, headers = {"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6ImZmcmV6cXNrejdmIiwiaWF0IjoxNjg2NzM1MTEyfQ.uk7IdzysJioPG3pdV2w99jNPHq5Uj6CWpIDiZ_WGhY0"}, verify=False)

req = "https://fr-couvinove301:3100/deleteEquipe/" + str(id)
response = requests.delete(req, headers = {"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6ImZmcmV6cXNrejdmIiwiaWF0IjoxNjg2NzM1MTEyfQ.uk7IdzysJioPG3pdV2w99jNPHq5Uj6CWpIDiZ_WGhY0"}, verify=False)
