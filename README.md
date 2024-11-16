# azure_web_crawler

## Setup

Storage account names must be globally unique. If you get an error when creating the storage account, try a different name.

```bash
az group create --name web-crawler-rg --location westeurope

az storage account create --name webcrawlerstorage12 --location westeurope --resource-group web-crawler-rg --sku Standard_LRS

az functionapp create --resource-group web-crawler-rg --consumption-plan-location westeurope --runtime node --runtime-version 20 --functions-version 4 --name web-crawler-func-app --storage-account webcrawlerstorage12 --os-type Linux
``` 

---

## Initialize

### This step is if you want to create a function from scratch. If you want to run the code then skip to deploy.

```bash
$ func init web-crawler-func-app --javascript
$ cd web-crawler-func-app
$ func new --name web-crawler-func-app --template "HTTP trigger"
```

Create a `functions.json` in `web-crawler-func-app/src/functions` with this content:

```json
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["get", "post"]
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
```

Install the dependency:

```bash
$ npm install jsdom
```

---

## Deploy

Before you deploy you can always test it locally:

```bash
$ func start
```

Once you confirm that it works, you can deploy it to Azure Functions:

```bash
$ func azure functionapp publish web-crawler-func-app
```

---

##  Clean up

```bash
$ az group delete --name web-crawler-rg --yes --no-wait
$ az storage account delete --name webcrawlerstorage12 --resource-group class-http-trigger-rg --yes
```
