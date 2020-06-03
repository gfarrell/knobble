import { Observable } from "rxjs";
import { Target } from "../target";

/**
 * A Source normally wraps a specific creation operator. This is where we start
 * our parsing journey. For example, a simple example could just emit a list of
 * URLs:
 *
 * ```typescript
 * import { Source } from "passable/lib/source";
 * import { makeTarget, Target } from "passable/lib/target";
 * import { map, of } from "rxjs/operators";
 *
 * export const SimpleSauce: Source {
 *   init() {
 *    return of(
 *      "https://www.bbc.co.uk/food/coulis",
 *      "https://www.bbc.co.uk/food/hoisin_sauce",
 *      "https://www.bbc.co.uk/food/bearnaise_sauce"
 *    ).pipe(map(makeTarget("bbc_recipe")));
 *   }
 * };
 * ```
 */
export interface Source {
  init: () => Observable<Target>;
}
