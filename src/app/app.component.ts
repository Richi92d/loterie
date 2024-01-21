import { Component, OnInit } from '@angular/core';
import { lotoArray } from './result_array';

export interface LottoResult {
  boule_1: string;
  boule_2: string;
  boule_3: string;
  boule_4: string;
  boule_5: string;
  numero_chance: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  lottoResults: LottoResult[] = lotoArray.flatMap((innerArray: any) => innerArray);

  topNumbers: string[] = [];
  mostFrequentNumeroChance: string = '';
  occurrencesNumbers: { [key: string]: number } = {};
  resultStatistics!: { topNumbers: string[]; mostFrequentNumeroChance: string; };

  constructor() { }

  ngOnInit(): void {
    this.calculerProbabilites();
    this.exemplesCalculProbabilites();
  }

  calculerProbabilites(): void {
    const occurrencesNumbers: { [key: string]: number } = {};
    const occurrencesNumeroChance: { [key: string]: number } = {};

    this.lottoResults.forEach((result: LottoResult) => {
      for (let i = 1; i <= 5; i++) {
        const bouleKey = `boule_${i}` as keyof LottoResult;
        const bouleValue = result[bouleKey];
        occurrencesNumbers[bouleValue] = (occurrencesNumbers[bouleValue] || 0) + 1;
      }

      const numeroChanceKey = 'numero_chance' as keyof LottoResult;
      const numeroChanceValue = result[numeroChanceKey];
      occurrencesNumeroChance[numeroChanceValue] = (occurrencesNumeroChance[numeroChanceValue] || 0) + 1;
    });

    const sortedOccurrencesNumbers = Object.entries(occurrencesNumbers)
      .sort((a, b) => b[1] - a[1]);

    const sortedOccurrencesNumeroChance = Object.entries(occurrencesNumeroChance)
      .sort((a, b) => b[1] - a[1]);

    const top5Numbers = sortedOccurrencesNumbers.slice(0, 5).map(([element]) => element);

    this.resultStatistics = {
      topNumbers: top5Numbers,
      mostFrequentNumeroChance: sortedOccurrencesNumeroChance[0][0]
    };
  }

  // Exemples de calculs de probabilités
  exemplesCalculProbabilites(): void {
    // Exemple de probabilité simple
    const probabiliteSimpleBoule1 = this.calculerProbabiliteSimple(this.topNumbers[0]);
    console.log(`Probabilité simple pour la boule 1 : ${probabiliteSimpleBoule1}`);

    // Exemple de probabilité conditionnelle
    const probabiliteCondBoule1GivenBoule2 = this.calculerProbabiliteConditionnelle(this.topNumbers[0], this.topNumbers[1]);
    console.log(`Probabilité conditionnelle pour la boule 1 sachant la boule 2 : ${probabiliteCondBoule1GivenBoule2}`);

    // Exemple de probabilité marginale
    const probabiliteMarginaleBoule1GivenBoule2NotInTop5 = this.calculerProbabiliteMarginale(this.topNumbers[0], this.topNumbers[5]);
    console.log(`Probabilité marginale pour la boule 1, sachant que la boule 2 n'est pas dans le top 5 : ${probabiliteMarginaleBoule1GivenBoule2NotInTop5}`);
  }

  // Méthode de probabilité simple
  calculerProbabiliteSimple(boule: string): number {
    const totalOccurrences = this.lottoResults.length * 5; // 5 boules par tirage
    const occurrences = this.occurrencesNumbers[boule] || 0;
    return occurrences / totalOccurrences;
  }

  // Méthode de probabilité conditionnelle
  calculerProbabiliteConditionnelle(bouleA: string, bouleB: string): number {
    const occurrencesA = this.occurrencesNumbers[bouleA] || 0;
    const occurrencesBsiA = this.lottoResults.filter(result => result[`boule_${bouleB}` as keyof LottoResult] === bouleA).length;
    return occurrencesBsiA / occurrencesA;
  }

  // Méthode de probabilité marginale
  calculerProbabiliteMarginale(bouleA: string, bouleBsiNotA: string): number {
    const occurrencesA = this.occurrencesNumbers[bouleA] || 0;
    const occurrencesNotA = this.lottoResults.length * 5 - occurrencesA; // Complémentaire de A
    const occurrencesBsiNotA = this.lottoResults.filter(result => result[`boule_${bouleBsiNotA}` as keyof LottoResult] === bouleA).length;
    return occurrencesBsiNotA / occurrencesNotA;
  }

}
