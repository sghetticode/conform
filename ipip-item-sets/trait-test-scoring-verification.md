# Trait test scoring verification

## On submit `gradeTest()` does the following

It grades the 50 IPIP items saved locally in `answers`, then saves the scores for each factor in 
localStorage to be passed to `revealResults()`.

- **Scoring (official IPIP +/- key)** Plus items: `way off` = 1, `inaccurate` = 2, `neither` = 3, 
`accurate` = 4, `spot on` = 5; Minus items (reverse): `way off` = 5... `spot on` = 1
- **Totals** per factor = sum of its 10 scored items (range 10-50)
- **Percentage** per factor = `(total - 10) / 40 * 100` (range 0-100%)
- Item factor and key direction are read from each item cell's CSS classes in `index.html`
(e.g. `<td class="extraversion plus">`) at module load into an `items` map

## On submit `revealResults()` does the following

It populates the results table with percentages for each factor saved locally in `results`, 
then hides the main content to display the user's trait test results.

## Plus/minus item keys

| Factor                      | + items | - items |
| --------------------------- | ------- | ------- |
| Extraversion (EXT)          | 5       | 5       |
| Agreeableness (AGR)         | 6       | 4       |
| Conscientiousness (CON)     | 6       | 4       |
| Emotional Stability (ES)    | 2       | 8       |
| Intellect/Imagination (II)  | 7       | 3       |

### Expected console output shape

```JavaScript
Trait Test Results: {
  'extraversion': { total: 10-50, percentage: 0-100 },
  'agreeableness': { total: 10-50, percentage: 0-100 },
  'conscientiousness': { total: 10-50, percentage: 0-100 },
  'emotional-stability': { total: 10-50, percentage: 0-100 },
  'intellect-imagination': { total: 10-50, percentage: 0-100 }
}
```

Plus a `console.table` rendering of the same data; example shows an all-"Neither" run

### Test area 1: Uniform runs

Answer all 50 items the same way for a quick end-to-end check. Expected `{ total, percentage }` 
per factor:

| All items answered | EXT      | AGR      | CON      | ES       | II       |
| ------------------ | -------- | -------- | -------- | -------- | -------- |
| **Way off**        | 30 / 50% | 26 / 40% | 26 / 40% | 42 / 80% | 22 / 30% |
| **Inaccurate**     | 30 / 50% | 28 / 45% | 28 / 45% | 36 / 65% | 26 / 40% |
| **Neither**        | 30 / 50% | 30 / 50% | 30 / 50% | 30 / 50% | 30 / 50% |
| **Accurate**       | 30 / 50% | 32 / 55% | 32 / 55% | 24 / 35% | 34 / 60% |
| **Spot on**        | 30 / 50% | 34 / 60% | 34 / 60% | 18 / 20% | 38 / 70% |

Sanity properties to eyeball:

- EXT is always 30/50% (perfectly balanced 5+/5-).
- "Way off" and "Spot on" rows mirror each other (per-factor totals add to 60).
- ES swings opposite to II (ES is minus-heavy, II is plus-heavy) that is the reversal logic working.

### Test area 2: Single-factor isolation

Confirms each factor's items route to the right bucket with the right key mix.
Answer the target factor's items one way, everything else "Neither".

Target factor all **Spot on**:

| Target factor         | Expected target result | Other 4 factors |
| --------------------- | ---------------------- | --------------- |
| Extraversion          | 30 / 50%               | all 30 / 50%    |
| Agreeableness         | 34 / 60%               | all 30 / 50%    |
| Conscientiousness     | 34 / 60%               | all 30 / 50%    |
| Emotional stability   | 18 / 20%               | all 30 / 50%    |
| Intellect/imagination | 38 / 70%               | all 30 / 50%    |

Target factor all **Way off**:

| Target factor         | Expected target result | Other 4 factors |
| --------------------- | ---------------------- | --------------- |
| Extraversion          | 30 / 50%               | all 30 / 50%    |
| Agreeableness         | 26 / 40%               | all 30 / 50%    |
| Conscientiousness     | 26 / 40%               | all 30 / 50%    |
| Emotional stability   | 42 / 80%               | all 30 / 50%    |
| Intellect/imagination | 22 / 30%               | all 30 / 50%    |

Item numbers are shown in the left column of each table, so you can count off
which items belong to a factor (or check the `class="factor plus/minus"` attribute in
`index.html`).

### Test area 3: Single-item flips

Cleanest unit test of +/- scoring on known items (`index.html:113-131`). Baseline:
all items "Neither" (every factor 30 / 50%). Change exactly one item:

| Flip                                                        | Expected change | Expected factor result |
| ----------------------------------------------------------- | --------------- | ---------------------- |
| #1 "Am the life of the party." (EXT **+**) -> Spot on       | EXT +2          | 32 / 55%               |
| #1 -> Way off                                               | EXT -2          | 28 / 45%               |
| #2 "Feel little concern for others." (AGR **-**) -> Spot on | AGR **-2**      | 28 / 45%               |
| #2 -> Way off                                               | AGR **+2**      | 32 / 55%               |
| #4 "Get stressed out easily." (ES **-**) -> Spot on         | ES -2           | 28 / 45%               |

If item #2 or #4 moves its factor the "wrong" direction, minus items are not being
reversed.

### Test area 4: Boundary checks

Requires answering by item key direction):

- Every **+** item "Spot on" and every **-** item "Way off" -> every factor **50 / 100%**
- Inverse (- "Spot on", + "Way off") -> every factor **10 / 0%**

### Failure signatures

| Symptom cause                                                           | Likely                                                 |
| ----------------------------------------------------------------------- | -------------------------------------------------------|
| Minus-keyed factors move the wrong direction (test area 3)              | Reversal logic missing/inverted                        |
| All factors identical on every uniform run                              | Score maps not keyed by sign, or sign detection broken |
| `NaN` in results                                                        | Missing guard for unknown response values              |
| Non-EXT factors off by a constant on uniform runs                       | Wrong factor attribution from CSS classes              |
