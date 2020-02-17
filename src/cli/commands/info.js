/*
 * CLI: Command: INFO
 */

const { ServerlessSDK } = require('@serverless/platform-client')
const utils = require('../utils')
const chalk = require('chalk')
const moment = require('moment')

module.exports = async (config, cli) => {
  // Start CLI persistance status
  cli.start('Initializing', { timer: false })

  // Ensure the user is logged in, or advertise
  if (!utils.isLoggedIn()) {
    cli.advertise()
  }

  // Load YAML
  const instanceYaml = await utils.loadInstanceConfig(process.cwd())

  // Presentation
  cli.logLogo()
  cli.log()

  cli.status('Initializing', instanceYaml.name)

  // Get access key
  const accessKey = await utils.getTokenId()

  // Check they are logged in
  if (!accessKey) {
    cli.error(`Run 'serverless login' first to run your serverless component.`, true)
  }

  // Load Instance Credentials
  const instanceCredentials = await utils.loadInstanceCredentials(instanceYaml.stage)

  // initialize SDK
  const sdk = new ServerlessSDK({
    accessKey,
    context: {
      orgName: instanceYaml.org
    }
  })

  // don't show the status in debug mode due to formatting issues
  if (!config.debug) {
    cli.status('Loading Info', null, 'white')
  }

  // Fetch info
  const instance = await sdk.info(instanceYaml, instanceCredentials, {})

  // Throw a helpful error if the instance was not deployed
  if (!instance) {
    throw new Error(
      `Instance "${instanceYaml.name}" was never deployed. Please deploy the instance first, then run "serverless info" again.`
    )
  }

  // format last action for better UX
  const lastActionAgo = moment(instance.lastActionAt).fromNow()

  const dashboardUrl = utils.getInstanceDashboardUrl(instanceYaml)

  // show the most important information, and link to the dashboard
  cli.log(`${chalk.grey('Status:')}       ${instance.instanceStatus}`)
  cli.log(`${chalk.grey('Last Action:')}  ${instance.lastAction} (${lastActionAgo})`)
  cli.log(`${chalk.grey('Deployments:')}  ${instance.instanceMetrics.deployments}`)
  cli.log(`${chalk.grey('More Info:')}    ${dashboardUrl}`)

  // show state only in debug mode
  if (config.debug) {
    cli.log()
    cli.log(`${chalk.grey('State:')}`)
    cli.log()
    cli.logOutputs(instance.state)
    cli.log()
    cli.log(`${chalk.grey('Outputs:')}`)
  }

  cli.log()
  cli.logOutputs(instance.outputs)

  cli.close('success', 'Success')
}
