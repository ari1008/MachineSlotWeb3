Voici une explication du contrat `SimpleSlotMachine` et comment l'utiliser :

### Explication du contrat

Le contrat `SimpleSlotMachine` est un contrat intelligent Solidity qui implémente une machine à sous simple. Voici les principales fonctionnalités et composants du contrat :

- **Propriétaire** : L'adresse du propriétaire du contrat est stockée dans la variable `owner`.
- **Montant du pari** : Le montant du pari par défaut est de 0.001 ETH, stocké dans `betAmount`.
- **Nombre de symboles** : Le nombre de symboles différents sur les rouleaux est de 6, stocké dans `numberOfSymbols`.
- **Multiplicateurs de gains** : Les multiplicateurs pour trois symboles identiques et deux symboles identiques sont respectivement `threeMatchMultiplier` (5) et `twoMatchMultiplier` (2).
- **Mappings** : `totalWinnings` et `totalBets` sont des mappings qui suivent les gains et les paris totaux de chaque joueur.
- **Événement** : L'événement `Spin` est émis à chaque fois qu'un joueur fait tourner la machine à sous.

### Fonctions principales

- **setBetAmount** : Permet de définir le montant du pari.
- **spin** : Permet à un joueur de faire tourner la machine à sous en envoyant le montant du pari. La fonction génère un résultat aléatoire, calcule les gains et transfère les gains au joueur si applicable.
- **getPlayerStats** : Retourne les statistiques d'un joueur (total des paris, total des gains, résultat net).
- **getBalance** : Retourne le solde du contrat.
- **addFunds** : Permet d'ajouter des fonds au contrat.
- **withdrawFunds** : Permet au propriétaire de retirer des fonds du contrat.

### Utilisation du contrat

1. **Déploiement** : Déployez le contrat sur le réseau Ethereum en utilisant un environnement de développement comme Remix ou Truffle sur du Sepolia.
2. **Définir le montant du pari** : Utilisez la fonction `setBetAmount` pour définir le montant du pari si vous souhaitez un montant différent de 0.001 ETH.
3. **Ajouter des fonds** : Le propriétaire peut ajouter des fonds au contrat en utilisant la fonction `addFunds`.
4. **Faire tourner la machine à sous** : Les joueurs peuvent appeler la fonction `spin` en envoyant le montant du pari. Le résultat de la rotation et les gains éventuels seront déterminés et transférés automatiquement.
5. **Vérifier les statistiques** : Les joueurs peuvent vérifier leurs statistiques en appelant la fonction `getPlayerStats`.
6. **Retirer des fonds** : Le propriétaire peut retirer des fonds du contrat en utilisant la fonction `withdrawFunds`.

## Attention
Assurez-vous d'avoir suffisamment de fonds dans le contrat pour couvrir les gains potentiels avant de permettre aux joueurs de faire tourner la machine à sous.