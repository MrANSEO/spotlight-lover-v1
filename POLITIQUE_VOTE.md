# Politique de Vote - Clarification

## Pourquoi un Candidat NE PEUT PAS voter pour lui-même?

### Raison 1: Prévention de la Triche
- Si candidats pouvaient voter pour eux, ils pourraient:
  - Créer des faux comptes et voter pour eux infiniment
  - Manipuler le classement
  - Acheter des votes et se voter eux-mêmes

### Raison 2: Intégrité du Concours
- Les votes doivent venir d'autres utilisateurs
- C'est un véritable "concours de popularité"
- Le score reflète le soutien réel de la communauté

### Raison 3: Fairness Économique
- Coût du vote: 100 FCFA
- Si un candidat pouvait se voter, ça serait une "perte financière" inutile
- Exemple: Voter 10 fois pour soi = -1000 FCFA sans bénéfice réel

---

## Comment un Candidat peut Utiliser son Crédit de Parrainage?

### Scénario 1: Voter pour ses Amis Candidats
```
User A:
- Invité 10 amis → +500 FCFA de crédit
- Devient candidat lui-même
- Vote 5 fois pour ses amis candidats = -500 FCFA
- Résultat: Ses amis montent dans le classement grâce à lui
- Communauté plus engagée!
```

### Scénario 2: Voter pour d'Autres Talents Favoris
```
User B:
- Reçu 1000 FCFA de parrainage
- N'est pas candidat
- Vote 10 fois pour ses talents préférés = -1000 FCFA
- Résultat: Soutien la communauté artistique
```

### Scénario 3: Monétiser son Talent
```
User C:
- Candidat populaire
- Invite ses fans à s'inscrire via son lien de parrainage
- Ses fans reçoivent du crédit et votent pour lui = Victoire par engagement!
```

---

## Économie du Système

### Sources de Crédit pour Voter:
1. **Paiement Direct**: User paie 100 FCFA = 1 vote
2. **Bonus de Parrainage**: Invite ami = +50 FCFA
3. **Promotion/Reward**: (futur) Tâches complétées = bonus

### Utilisation du Crédit:
- Voter pour n'importe quel candidat SAUF soi-même
- Remise progressive possible (5 votes = 450 FCFA au lieu de 500)
- Bonus votes en fin de concours (2 votes pour 100 FCFA)

---

## Modification Possible (si souhaité):

Si tu VEUX que les candidats puissent voter pour eux, ajoute une règle:

```typescript
// Option 1: Autoriser mais avec surcoût
if (voterId === candidateId) {
  // Coûte 200 FCFA au lieu de 100
  checkBalance(voterId, 200);
}

// Option 2: Limiter le nombre
if (voterId === candidateId && voteCount > 5) {
  throw new Error('Max 5 auto-votes');
}

// Option 3: Cacher les auto-votes du classement
if (voterId === candidateId) {
  // Compter mais ne pas afficher publiquement
  vote.isSelfVote = true;
  vote.hiddenFromPublic = true;
}
```

**Recommandation**: Garde la règle actuelle (pas d'auto-vote). C'est plus juste! 🎯
