import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
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
  predictedNumbers: { topNumbers: string[]; predictedNumeroChance: string; } = { topNumbers: [], predictedNumeroChance: '' };
  percentage: number = 0;
  totalCombinations: number = 1906884;

  constructor(private datePipe: DatePipe) { }

  ngOnInit(): void {
    this.lottoResults = this.flattenLotoArray(lotoArray);
    this.calculateProbabilities();
    this.predictNextNumbers();
  }

  flattenLotoArray(arr: any[]): LottoResult[] {
    return arr.flatMap((innerArray: any) => innerArray);
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

  calculateOccurrences(combination: string[]): number {
    const mainNumbers = combination.slice(0, 5);
    const numeroChance = combination[5];

    const occurrences = this.lottoResults.filter(result => {
      const isMatch = mainNumbers.every(num =>
        result[`boule_${num}` as keyof LottoResult] === num
      );
      const numeroChanceMatch = result.numero_chance === numeroChance;

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

    // Exclure les boules du dernier tirage des prédictions
    const lastDrawNumbers: any = [];
    for (let i = 1; i <= 5; i++) {
      const bouleKey = `boule_${i}` as keyof LottoResult;
      lastDrawNumbers.push(this.lottoResults[0][bouleKey]);
    }
    const predictedNumbersFiltered = predictedTopNumbers.filter(num => !lastDrawNumbers.includes(num));

    // Obtenez les boules les plus susceptibles de suivre les numéros les plus fréquents
    const nextNumbers: { [key: string]: number } = {};
    this.lottoResults.forEach(result => {
      predictedNumbersFiltered.forEach(num => {
        for (let i = 1; i <= 5; i++) {
          const bouleKey = `boule_${i}` as keyof LottoResult;
          if (result[bouleKey] === num) {
            const nextBouleKey = `boule_${i + 1}` as keyof LottoResult;
            const nextBouleValue = result[nextBouleKey];
            if (nextBouleValue !== undefined) {
              nextNumbers[nextBouleValue] = (nextNumbers[nextBouleValue] || 0) + 1;
            }
          }
        }
      });
    });

    // Trier les boules suivantes par fréquence d'apparition
    const sortedNextNumbers = Object.keys(nextNumbers)
      .sort((a, b) => nextNumbers[b] - nextNumbers[a]);

    // Sélectionner les 5 prochaines boules en fonction du total des combinaisons possibles
    const finalPredictedNumbers = sortedNextNumbers.slice(0, 5).map(num => parseInt(num, 10) % this.totalCombinations + 1);

    // Obtenez le prochain numéro chance prédit en fonction de la probabilité
    const predictedNumeroChance = this.predictNumeroChance();

    // Mettez à jour la propriété predictedNumbers avec les valeurs calculées
    this.predictedNumbers = { topNumbers: finalPredictedNumbers.map(String), predictedNumeroChance: predictedNumeroChance || '' };
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
    // Probabilité de base basée sur le nombre d'occurrences
    const baseProbability = this.occurrencesNumbers[numeroChance] / this.lottoResults.length;

    return baseProbability;
  }

}
