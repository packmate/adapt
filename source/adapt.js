const { plural } = require('pluralize')

// ---------------------------------------------

function search({ data, selector, mode, origin }) {
  const properties = selector.split('.')
  const selected = select({ data, selector: properties[0], mode, origin })

  if ([ 'string', 'number' ].includes(typeof(selected)) || Array.isArray(selected)) {
    return selected
  }

  selector = properties.slice(1).join('.')
  return search({ data: selected, selector, mode, origin })
}

// ---------------------------------------------

function select({ data, selector, mode, origin }) {
  let value = data[selector]

  if (!value) {
    const expanded = data[plural(selector)]

    try {
      value = expanded && search({ data: expanded, selector: mode, mode })
    }

    catch {
      value = expanded._default
    }
  }

  if (!value && origin) {
    throw new Error(`[adapt] The selector '${ selector }' of '${ origin }' could not be found in the configuration.`)
  }

  if (!value) {
    throw new Error(`[adapt] The selector '${ selector }' could not be found in the configuration.`)
  }

  return value
}

// ---------------------------------------------

module.exports = ({ configuration, environment }) => {
  if (!configuration || !environment) {
    throw new Error('Adapt must be configured with the configuration and environment objects.')
  }

  const { mode } = environment

  if (!mode) {
    throw new Error('The environment object must include the application mode.')
  }

  return (selector) => {
    let value

    if (!selector) {
      throw new Error('No selector was present.')
    }

    if (!selector.includes('.')) {
      value = select({ data: configuration, selector, mode })
    }

    if (selector.includes('.')) {
      value = search({ data: configuration, selector, mode, origin: selector })
    }

    if (typeof(value) === 'string' && value.includes('[')) {
      const matcher = /\[(.*)\]/
      const match = value.match(matcher)[1]

      value = environment[match]

      if (!value) {
        throw new Error(`[adapt] A value for '${ match }' could not be found in the environment.`)
      }
    }

    return value
  }
}
