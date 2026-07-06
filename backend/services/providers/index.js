const logger = require("../../config/logger");

const AdzunaProvider = require("./adzuna.provider");
const RemotiveProvider = require("./remotive.provider");
const ArbeitnowProvider = require("./arbeitnow.provider");
const GreenhouseProvider = require("./greenhouse.provider");
const LeverProvider = require("./lever.provider");
const SmartRecruitersProvider = require("./smartrecruiters.provider");
const AshbyProvider = require("./ashby.provider");
const RecruiteeProvider = require("./recruitee.provider");

// New Providers
const LinkedInProvider = require("./linkedin.provider");
const IndeedProvider = require("./indeed.provider");
const NaukriProvider = require("./naukri.provider");
const FounditProvider = require("./foundit.provider");
const CutshortProvider = require("./cutshort.provider");
const InstahyreProvider = require("./instahyre.provider");
const WellfoundProvider = require("./wellfound.provider");
const YCJobsProvider = require("./ycjobs.provider");

const REGISTERED = [
  new AdzunaProvider(),
  new RemotiveProvider(),
  new ArbeitnowProvider(),
  new GreenhouseProvider(),
  new LeverProvider(),
  new SmartRecruitersProvider(),
  new AshbyProvider(),
  new RecruiteeProvider(),
  new LinkedInProvider(),
  new IndeedProvider(),
  new NaukriProvider(),
  new FounditProvider(),
  new CutshortProvider(),
  new InstahyreProvider(),
  new WellfoundProvider(),
  new YCJobsProvider(),
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
