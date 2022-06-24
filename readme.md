This is Interact API Backend created by Daniel Kravec

```
docker build -t novapro/interact_api . && docker tag novapro/interact_api registry.xnet.com:5000/novapro/interact_api:latest && sudo docker push registry.xnet.com:5000/novapro/interact_api
```

To build Docker Image:
$ docker build -t novapro/interact_api .

To Run/Test localy:
$ docker run --name interact_api -d novapro/interact_api:latest

To Stop test (get container_id from docker ps):
$ docker stop <container_id>

To Login Into Registry (SHould only have to do once ever):
$ docker login registry.xnet.com:5000

To push image to registry:
$ docker tag novapro/interact_api registry.xnet.com:5000/novapro/interact_api:latest
$ docker push registry.xnet.com:5000/novapro/interact_api

Registry Format:
// Eg: registry.xnet.com:5000/daniel/novapro/homepage_test:latest

Docker Tag Standard:
 is the latest master master build (used for production)
 is the latest non master branch build
<COMMIT_SHA> Images are tagged with its  matching commit IDs
