import { Component, OnInit } from '@angular/core';
import { lotoArray } from './result_array';

interface LottoResult {
  boule_1: string;
  boule_2: string;
  boule_3: string;
  boule_4: string;
  boule_5: string;
  numero_chance: string;
  jour_de_tirage: string;
  date_de_tirage: string; // Ajout de la propriété date_de_tirage
  boule_1_second_tirage?: string;
  boule_2_second_tirage?: string;
  boule_3_second_tirage?: string;
  boule_4_second_tirage?: string;
  boule_5_second_tirage?: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  lottoResults: LottoResult[] = [];
  occurrencesNumbers: { [key: string]: number } = {};
  resultStatistics!: { topNumbers: string[]; mostFrequentNumeroChance: string; };
  totalCombinations: number = this.calculateTotalCombinations();
  predictedNumbers: { topNumbers: string[]; predictedNumeroChance: string; } = { topNumbers: [], predictedNumeroChance: '' };
  percentage: number = 0;

  constructor() { }

  ngOnInit(): void {
    this.lottoResults = this.flattenLotoArray(lotoArray);
    this.calculateProbabilities();
    this.displayResults();
    this.predictNextNumbers();
    this.calculatePercentage();
  }

  flattenLotoArray(arr: any[]): LottoResult[] {
    return arr.flatMap((innerArray: any) => innerArray);
  }

  calculateTotalCombinations(): number {
    const totalNumbers = 49;
    const totalNumeroChances = 10;
    return this.calculateCombinations(totalNumbers, 5) * totalNumeroChances;
  }

  calculateCombinations(n: number, k: number): number {
    if (k === 0 || k === n) {
      return 1;
    } else {
      return this.calculateCombinations(n - 1, k - 1) + this.calculateCombinations(n - 1, k);
    }
  }

  calculateProbabilities(): void {
    this.lottoResults.forEach(result => {
      // Primary draw
      for (let i = 1; i <= 5; i++) {
        const bouleKey = `boule_${i}` as keyof LottoResult;
        const bouleValue = result[bouleKey];
        if (bouleValue !== undefined) {
          this.occurrencesNumbers[bouleValue] = (this.occurrencesNumbers[bouleValue] || 0) + 1;
        }
      }

      const numeroChanceKey = 'numero_chance' as keyof LottoResult;
      const numeroChanceValue = result[numeroChanceKey];
      if (numeroChanceValue !== undefined) {
        this.occurrencesNumbers[numeroChanceValue] = (this.occurrencesNumbers[numeroChanceValue] || 0) + 1;
      }

      // Secondary draw
      for (let i = 1; i <= 5; i++) {
        const bouleKeySecondTirage = `boule_${i}_second_tirage` as keyof LottoResult;
        const bouleValueSecondTirage = result[bouleKeySecondTirage];
        if (bouleValueSecondTirage !== undefined) {
          this.occurrencesNumbers[bouleValueSecondTirage] = (this.occurrencesNumbers[bouleValueSecondTirage] || 0) + 1;
        }
      }
    });

    const sortedOccurrencesNumbers = this.sortOccurrences(this.occurrencesNumbers);
    const top5Numbers = sortedOccurrencesNumbers.slice(0, 5).map(([element]) => element);

    this.resultStatistics = {
      topNumbers: top5Numbers,
      mostFrequentNumeroChance: sortedOccurrencesNumbers[0]?.[0] || '',
    };
  }

  sortOccurrences(occurrences: { [key: string]: number }): [string, number][] {
    return Object.entries(occurrences).sort((a, b) => b[1] - a[1]);
  }

  calculatePercentage(): void {
    const winningCombination = this.resultStatistics.topNumbers.concat([this.resultStatistics.mostFrequentNumeroChance]);
    const numberOfOccurrences = this.calculateOccurrences(winningCombination);
    const probability = 1 / this.totalCombinations;
    this.percentage = (probability * numberOfOccurrences) * 100;
  }

  calculateOccurrences(combination: string[]): number {
    const occurrences = this.lottoResults.filter(result => {
      const isMatch = combination.slice(0, 5).every(num => result[`boule_${num}` as keyof LottoResult] === num);
      const numeroChanceMatch = result.numero_chance === combination[5];

      return isMatch && numeroChanceMatch;
    }).length;

    return occurrences;
  }

  predictNextNumbers(): void {
    // Obtenez les numéros les plus fréquents, à l'exception du numéro chance actuel
    const predictedTopNumbers = Object.keys(this.occurrencesNumbers)
      .filter(num => num !== this.resultStatistics.mostFrequentNumeroChance)
      .sort((a, b) => this.occurrencesNumbers[b] - this.occurrencesNumbers[a])
      .slice(0, 5);

    // Obtenez les numéros aléatoires qui ne sont pas prédits à l'avance
    const availableRandomNumbers = Object.keys(this.occurrencesNumbers)
      .filter(num => !predictedTopNumbers.includes(num));

    // Triez les numéros aléatoires en fonction de la fréquence d'apparition
    const sortedRandomNumbers = availableRandomNumbers.sort((a, b) => this.occurrencesNumbers[b] - this.occurrencesNumbers[a]);

    // Ajoutez les numéros aléatoires les plus fréquents à la prédiction
    const remainingRandomNumbers = sortedRandomNumbers.slice(0, 10 - predictedTopNumbers.length);
    const finalPredictedNumbers = predictedTopNumbers.concat(remainingRandomNumbers);

    // Obtenez le prochain numéro chance prédit en fonction de la probabilité
    const predictedNumeroChance = this.predictNumeroChance();

    // Mettez à jour la propriété predictedNumbers avec les valeurs calculées
    this.predictedNumbers = { topNumbers: finalPredictedNumbers, predictedNumeroChance: predictedNumeroChance || '' };
  }


  predictNumeroChance(): string {
    // Calculer la probabilité de chaque numéro chance en fonction de la date de tirage
    const numeroChances = Object.keys(this.occurrencesNumbers).filter(num => !this.resultStatistics.topNumbers.includes(num));
    const probabilities = numeroChances.map(num => ({
      numeroChance: num,
      probability: this.calculateProbabilityForNumeroChance(num)
    }));

    // Triez les numéros chance en fonction de la probabilité de manière décroissante
    const sortedProbabilities = probabilities.sort((a, b) => b.probability - a.probability);

    // Retournez le numéro chance avec la probabilité la plus élevée
    return sortedProbabilities[0]?.numeroChance || '';
  }

  calculateProbabilityForNumeroChance(numeroChance: string): number {
    // Utilisez la date du dernier tirage
    const lastDrawDate = new Date(this.lottoResults[0].date_de_tirage); // Assurez-vous que les résultats sont triés par date décroissante

    // Calculez la différence de jours entre le dernier tirage et aujourd'hui
    const daysSinceLastDraw = this.calculateDaysDifference(lastDrawDate, new Date());

    // Poids de la probabilité en fonction de la différence de jours (à ajuster)
    const daysWeight = 1 / (daysSinceLastDraw + 1); // Ajoutez 1 pour éviter la division par zéro

    // Probabilité de base basée sur le nombre d'occurrences
    const baseProbability = this.occurrencesNumbers[numeroChance] / this.lottoResults.length;

    // Calculez la probabilité ajustée en appliquant le poids
    const adjustedProbability = baseProbability * daysWeight;

    return adjustedProbability;
  }

  calculateDaysDifference(date1: Date, date2: Date): number {
    const timeDifference = Math.abs(date2.getTime() - date1.getTime());
    const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
    return daysDifference;
  }

  displayResults(): void {
    const percentage = this.calculatePercentage();
    // Display the results and predictions in your HTML as needed
  }
}
