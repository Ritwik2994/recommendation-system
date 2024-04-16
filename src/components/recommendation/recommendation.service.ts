// export default class Recommender {
//   private factors: number;
//   private epochs: number;
//   private verbose: boolean;
//   private implicit: boolean;
//   private rated: Map<number, Set<number>>;
//   private minRating: number | null;
//   private maxRating: number | null;
//   private userMap: Map<string, number> = new Map();
//   private itemMap: Map<string, number> = new Map();
//   #globalMean: number;
//   #userFactors: Array<Array<number>>;
//   #itemFactors: Array<Array<number>>;
//   #normalizedUserFactors;
//   #normalizedItemFactors;

//   constructor(
//     options: { factors?: number; epochs?: number; verbose?: boolean } = {},
//   ) {
//     this.factors = options.factors ?? 8;
//     this.epochs = options.epochs ?? 20;
//     this.verbose = options.verbose ?? false;
//   }

//   fit(
//     trainSet: { userId: string; itemId: string; rating: number }[],
//     validationSet?: { userId: string; itemId: string; rating: number }[],
//   ) {
//     if (trainSet.length === 0) {
//       throw new Error("No training data");
//     }

//     this.implicit = !trainSet.some((v) => "rating" in v);

//     if (!this.implicit) {
//       this.checkRatings(trainSet);

//       if (validationSet) {
//         this.checkRatings(validationSet);
//       }
//     }

//     this.userMap = new Map();
//     this.itemMap = new Map();
//     this.rated = new Map();

//     const input: Array<Array<number>> = [];
//     for (const v of trainSet) {
//       const u = this.getUserIndex(v.userId);
//       const i = this.getItemIndex(v.itemId);
//       const rated = this.getRatedSet(u);
//       rated.add(i);
//       input.push([u, i, this.implicit ? 1 : v.rating!]);
//     }

//     if (!this.implicit) {
//       const ratings = trainSet.map((v) => v.rating!);
//       this.minRating = Math.min(...ratings);
//       this.maxRating = Math.max(...ratings);
//     } else {
//       this.minRating = null;
//       this.maxRating = null;
//     }

//     const evalSet: Array<Array<number>> | null = validationSet
//       ? validationSet.map((v) => {
//           const u = this.getUserIndex(v.userId) ?? -1;
//           const i = this.getItemIndex(v.itemId) ?? -1;
//           return [u, i, this.implicit ? 1 : v.rating!];
//         })
//       : null;

//     this.#globalMean = this.calculateGlobalMean(input);
//     this.#userFactors = this.initializeFactors(this.userMap.size, this.factors);
//     this.#itemFactors = this.initializeFactors(this.itemMap.size, this.factors);
//     this.trainModel(input, evalSet);

//     this.normalizedUserFactors = null;
//     this.normalizedItemFactors = null;
//   }

//   predict(data: { userId: string; itemId: string }[]): number[] {
//     const u = data.map((v) => this.getUserIndex(v.userId) ?? 0);
//     const i = data.map((v) => this.getItemIndex(v.itemId) ?? 0);

//     const predictions = Array(data.length);
//     for (let j = 0; j < data.length; j++) {
//       const userFactors = this.userFactors[u[j]];
//       const itemFactors = this.itemFactors[i[j]];
//       predictions[j] = this.innerProduct(userFactors, itemFactors);
//     }

//     if (this.minRating !== null) {
//       for (let j = 0; j < predictions.length; j++) {
//         predictions[j] = Math.max(
//           Math.min(predictions[j], this.maxRating!),
//           this.minRating!,
//         );
//       }
//     }

//     for (let j = 0; j < data.length; j++) {
//       if (u[j] === undefined || i[j] === undefined) {
//         predictions[j] = this.globalMean;
//       }
//     }

//     return predictions;
//   }

//   userRecs(userId: string, count = 5): { itemId: string; score: number }[] {
//     this.checkFit(); // Ensure model is initialized

//     const userIndex = this.userMap.get(userId);
//     if (userIndex === undefined) {
//       return [];
//     }

//     const ratedItems = this.rated.get(userIndex);

//     const userFactors = this.userFactors[userIndex];
//     const predictions = this.#itemFactors.map((itemFactor) =>
//       this.innerProduct(itemFactor, userFactors),
//     );

//     const candidates = predictions
//       .map((score, index) => ({ itemId: index, score }))
//       .filter((candidate) => !ratedItems.has(candidate.itemId))
//       .sort((a, b) => b.score - a.score)
//       .slice(0, count !== null ? count + ratedItems.size : undefined);

//     if (this.minRating !== null) {
//       candidates.forEach((candidate) => {
//         candidate.score = Math.max(
//           Math.min(candidate.score, this.maxRating),
//           this.minRating,
//         );
//       });
//     }

//     const itemIds = Array.from(this.itemMap.keys());
//     return candidates.map((candidate) => ({
//       itemId: itemIds[candidate.itemId],
//       score: candidate.score,
//     }));
//   }

//   itemRecs(itemId: string, count = 5): { itemId: string; score: number }[] {
//     this.checkFit();
//     return this.similar(
//       itemId,
//       "itemId",
//       this.itemMap,
//       this.normalizedItemFactors(),
//       count,
//     );
//   }

//   similarUsers(userId: string, count = 5): { userId: string; score: number }[] {
//     this.checkFit();
//     return this.similar(
//       userId,
//       "userId",
//       this.userMap,
//       this.normalizedUserFactors(),
//       count,
//     );
//   }

//   userIds(): string[] {
//     return Array.from(this.userMap.keys());
//   }

//   itemIds(): string[] {
//     return Array.from(this.itemMap.keys());
//   }

//   userFactors(userId: string): Array<number> | null {
//     const u = this.getUserIndex(userId);
//     return u !== undefined ? this.userFactors[u] : null;
//   }

//   itemFactors(itemId: string): Array<number> | null {
//     const i = this.getItemIndex(itemId);
//     return i !== undefined ? this.itemFactors[i] : null;
//   }

//   globalMean(): number {
//     return this.#globalMean;
//   }

//   private normalizedUserFactors(): Array<Array<number>> {
//     if (!this.normalizedUserFactors) {
//       this.#normalizedUserFactors = this.normalize(this.#userFactors);
//     }
//     return this.#normalizedUserFactors;
//   }

//   private normalizedItemFactors(): Array<Array<number>> {
//     if (!this.normalizedItemFactors) {
//       this.#normalizedItemFactors = this.normalize(this.#itemFactors);
//     }
//     return this.#normalizedItemFactors;
//   }

//   private normalize(factors: Array<Array<number>>): Array<Array<number>> {
//     return factors.map((row) => {
//       const norm = this.norm(row);
//       if (norm > 0) {
//         return row.map((x) => x / norm);
//       }
//       return row;
//     });
//   }

//   private similar(
//     id: string,
//     key: "userId" | "itemId",
//     map: Map<string, number>,
//     normFactors: Array<Array<number>>,
//     count: number,
//   ): Array<{ [key: string]: string | number }> {
//     const i = map.get(id);
//     if (i === undefined) {
//       return [];
//     }

//     const factors = normFactors[i];
//     const predictions = normFactors.map((v) => this.innerProduct(v, factors));

//     const candidates = predictions
//       .map((score, j) => ({ [key]: this.getKey(map, j), score }))
//       .filter((candidate) => candidate[key] !== id)
//       .sort((a, b) => b.score - a.score);

//     return candidates.slice(0, count);
//   }

//   private checkRatings(
//     ratings: { userId: string; itemId: string; rating: number }[],
//   ) {
//     for (const r of ratings) {
//       if (typeof r.rating !== "number") {
//         throw new Error("Rating must be numeric");
//       }
//     }
//   }

//   private checkFit() {
//     if (this.implicit === undefined) {
//       throw new Error("Not fit");
//     }
//   }

//   private getUserIndex(userId: string): number | undefined {
//     const index = this.userMap.get(userId);
//     if (index === undefined) {
//       this.userMap.set(userId, this.userMap.size);
//       return this.userMap.size - 1;
//     }
//     return index;
//   }

//   private getItemIndex(itemId: string): number | undefined {
//     const index = this.itemMap.get(itemId);
//     if (index === undefined) {
//       this.itemMap.set(itemId, this.itemMap.size);
//       return this.itemMap.size - 1;
//     }
//     return index;
//   }

//   private getRatedSet(userIndex: number): Set<number> {
//     let rated = this.rated.get(userIndex);
//     if (!rated) {
//       rated = new Set();
//       this.rated.set(userIndex, rated);
//     }
//     return rated;
//   }

//   private getKey(map: Map<string, number>, index: number): string {
//     return (
//       Array.from(map.entries()).find(([_, value]) => value === index)?.[0] || ""
//     );
//   }

//   private calculateGlobalMean(input: Array<Array<number>>): number {
//     let sum = 0;
//     let count = 0;
//     for (const [_, __, rating] of input) {
//       sum += rating;
//       count++;
//     }
//     return sum / count;
//   }

//   private initializeFactors(
//     size: number,
//     factors: number,
//   ): Array<Array<number>> {
//     const randomFactors = Array.from({ length: size }, () =>
//       Array.from({ length: factors }, () => Math.random()),
//     );
//     return randomFactors;
//   }

//   private trainModel(
//     input: Array<Array<number>>,
//     evalSet: Array<Array<number>> | null,
//   ) {
//     const learningRate = 0.01;
//     const regularization = 0.01;
//     const iterations = 100;

//     for (let iter = 0; iter < iterations; iter++) {
//       const errors = new Array(input.length);

//       for (let i = 0; i < input.length; i++) {
//         const [u, j, rating] = input[i];
//         const userFactors = this.userFactors[u];
//         const itemFactors = this.itemFactors[j];
//         const prediction =
//           this.innerProduct(userFactors, itemFactors) + this.#globalMean;
//         errors[i] = rating - prediction;

//         for (let k = 0; k < this.factors; k++) {
//           const userUpdate =
//             learningRate *
//             (errors[i] * itemFactors[k] - regularization * userFactors[k]);
//           const itemUpdate =
//             learningRate *
//             (errors[i] * userFactors[k] - regularization * itemFactors[k]);
//           userFactors[k] += userUpdate;
//           itemFactors[k] += itemUpdate;
//         }
//       }

//       if (evalSet) {
//         let validationError = 0;
//         for (const [u, j, rating] of evalSet) {
//           const userFactors =
//             u === -1 ? new Array(this.factors).fill(0) : this.userFactors[u];
//           const itemFactors =
//             j === -1 ? new Array(this.factors).fill(0) : this.itemFactors[j];
//           const prediction =
//             this.innerProduct(userFactors, itemFactors) + this.#globalMean;
//           validationError += (rating - prediction) ** 2;
//         }
//         validationError /= evalSet.length;
//         if (this.verbose) {
//           console.log(
//             `Iteration ${iter}: Validation error = ${validationError.toFixed(4)}`,
//           );
//         }
//       } else if (this.verbose) {
//         console.log(
//           `Iteration ${iter}: Training error = ${errors.reduce((sum, error) => sum + error ** 2, 0) / input.length}`,
//         );
//       }
//     }
//   }

//   private innerProduct(a: Array<number>, b: Array<number>): number {
//     let sum = 0;
//     for (let i = 0; i < a.length; i++) {
//       sum += a[i] * b[i];
//     }
//     return sum;
//   }

//   private norm(row: Array<number>): number {
//     let sum = 0;
//     for (const x of row) {
//       sum += x * x;
//     }
//     return Math.sqrt(sum);
//   }
// }
