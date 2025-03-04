export type TUserBalance =
  | {
      tokenBalance?: undefined;
      tokenAllowance?: undefined;
    }
  | {
      tokenBalance:
        | {
            error: Error;
            result?: undefined;
            status: "failure";
          }
        | {
            error?: undefined;
            result: bigint;
            status: "success";
          };
      tokenAllowance:
        | {
            error: Error;
            result?: undefined;
            status: "failure";
          }
        | {
            error?: undefined;
            result: bigint;
            status: "success";
          };
    }
  | undefined;
