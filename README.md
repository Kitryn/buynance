# buynance

## Installation

git clone then

```bash
npm install
```

## Testing

```npx hardhat test```


## Server

Development: Create a ```.env``` file in project root. App expects the following environment variables:

```
NODE_ENV = 'development' | 'production'
DBPATH
DBNAME
```

Run with ```npm run start:dev```


## Project structure

Backend related code in ```./server```. Typescript src files in ```./server/src```. Build with ```npm run build``` in root. Built files reside in ```./server/dist```. 
