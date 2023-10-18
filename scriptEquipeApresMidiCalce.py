import requests
import warnings
#Disable warnings
warnings.filterwarnings("ignore")

#récupération de la liste des sites CAP Exploitation
req = "https://fr-couvinove301:3100/deleteAffectationEquipe/117"
response = requests.get(req, headers = {"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6ImZmcmV6cXNrejdmIiwiaWF0IjoxNjg2NzM1MTEyfQ.uk7IdzysJioPG3pdV2w99jNPHq5Uj6CWpIDiZ_WGhY0"}, verify=False)
