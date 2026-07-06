const logger = require("../../config/logger");

const AdzunaProvider = require("./adzuna.provider");
const RemotiveProvider = require("./remotive.provider");
const ArbeitnowProvider = require("./arbeitnow.provider");
const GreenhouseProvider = require("./greenhouse.provider");
const LeverProvider = require("./lever.provider");
const SmartRecruitersProvider = require("./smartrecruiters.provider");
const AshbyProvider = require("./ashby.provider");
const RecruiteeProvider = require("./recruitee.provider");

/**
 * -----------------------------------------------------------------------------
 * Provider Registry
 * -----------------------------------------------------------------------------
 * Single source of truth for which job sources are wired into the aggregator.
 *
 * To add a new source:
 *   1. Create `<name>.provider.js` extending BaseJobProvider.
 *   2. Add one line to REGISTERED below.
 * The aggregator, cron cache-refresh and health checks pick it up automatically.
 *
 * Providers whose `isEnabled()` returns false (missing keys/config) are skipped
 * at startup so an unconfigured source never adds latency or noise.
 *
 * NOTE: Teamtailor and Wellfound are intentionally omitted — neither exposes a
 * usable keyless public search API. They can be dropped in here the moment
 * credentials/endpoints are available, with zero changes elsewhere.
 */
const REGISTERED = [
  new AdzunaProvider(),
  new RemotiveProvider(),
  new ArbeitnowProvider(),
  new GreenhouseProvider(),
  new LeverProvider(),
  new SmartRecruitersProvider(),
  new AshbyProvider(),
  new RecruiteeProvider(),
];

const enabledProviders = REGISTERED.filter((p) => {
  const on = p.isEnabled();
  if (!on) {
    logger.warn(`Provider Registry: "${p.name}" is disabled (missing configuration).`);
  }
  return on;
});

logger.info(
  `Provider Registry: ${enabledProviders.length}/${REGISTERED.length} providers enabled → [${enabledProviders
    .map((p) => p.name)
    .join(", ")}]`
);

module.exports = {
  providers: enabledProviders,
  allProviders: REGISTERED,
};
