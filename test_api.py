import urllib.request
import json

data = json.dumps({"email":"agent1@example.com","password":"123456"}).encode('utf-8')
req = urllib.request.Request('http://52.253.105.93/api/v1/auth/login', data=data, headers={'Content-Type':'application/json'})
res = urllib.request.urlopen(req)
token = json.loads(res.read())['data']['accessToken']

req2 = urllib.request.Request('http://52.253.105.93/api/v1/tickets', headers={'Authorization': 'Bearer ' + token})
res2 = urllib.request.urlopen(req2)
print(json.dumps(json.loads(res2.read()), indent=2))
