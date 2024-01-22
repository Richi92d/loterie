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
  totalCombinations: number = 19068840; // Nombre total de combinaisons possibles

  constructor() { }

  ngOnInit(): void {
    this.lottoResults = this.flattenLotoArray(lotoArray);
    this.calculateProbabilities();
    this.displayResults();
  }

  flattenLotoArray(arr: any[]): LottoResult[] {
    return arr.flatMap((innerArray: any) => innerArray);
  }

  calculateProbabilities(): void {
    this.lottoResults.forEach(result => {
      for (let i = 1; i <= 5; i++) {
        const bouleKey = `boule_${i}` as keyof LottoResult;
        const bouleValue = result[bouleKey];
        this.occurrencesNumbers[bouleValue] = (this.occurrencesNumbers[bouleValue] || 0) + 1;
      }

      const numeroChanceKey = 'numero_chance' as keyof LottoResult;
      const numeroChanceValue = result[numeroChanceKey];
      this.occurrencesNumbers[numeroChanceValue] = (this.occurrencesNumbers[numeroChanceValue] || 0) + 1;
    });

    const sortedOccurrencesNumbers = this.sortOccurrences(this.occurrencesNumbers);
    const top5Numbers = sortedOccurrencesNumbers.slice(0, 5).map(([element]) => element);

    this.resultStatistics = {
      topNumbers: top5Numbers,
      mostFrequentNumeroChance: sortedOccurrencesNumbers[0][0],
    };
  }

  sortOccurrences(occurrences: { [key: string]: number }): [string, number][] {
    return Object.entries(occurrences).sort((a, b) => b[1] - a[1]);
  }

  calculatePercentage(): number {
    const winningCombination = this.resultStatistics.topNumbers.concat([this.resultStatistics.mostFrequentNumeroChance]);
    const numberOfOccurrences = this.calculateOccurrences(winningCombination);
    return (numberOfOccurrences / this.totalCombinations) * 100;
  }

  calculateOccurrences(combination: string[]): number {
    const occurrences = this.lottoResults.filter(result =>
      combination.every(num => result[`boule_${num}` as keyof LottoResult] === num)
      && result.numero_chance === combination[combination.length - 1]
    ).length;

    return occurrences;
  }

  public displayResults(): void {
    const percentage = this.calculatePercentage();
    console.log(`Top Numbers: ${this.resultStatistics.topNumbers.join(' ')} | Most Frequent Numero Chance: ${this.resultStatistics.mostFrequentNumeroChance}`);
    console.log(`Chance of winning with this combination: ${percentage.toFixed(4)}%`);
  }
}
