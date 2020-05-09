const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const { extname } = path

const dirnames = process.mainModule.filename.includes('pro') ?
    ['solid', 'linear', 'duotone', 'brand', 'flag']
  : ['free', 'brand', 'flag']

let allNames = {}
dirnames.forEach(setName => {
  mkdirp(`js/${setName}/`, function(err) {
    if (err) {
      return
    } 
    const dirname = `svg/${setName}/`
    fs.readdir(dirname, (e, filenames) => {
      if (e) {
        return
      }
      let contents = {}
      let names = []
      filenames.forEach(filename => {
        console.log(filename)
        if (extname(filename) === '.svg') {
          fs.readFile(dirname + filename, 'utf-8', function (e, content) {
            if (e) {
              return
            } 
            
            const variableName = toCamel(filename.replace('.svg', ''))
            const jsFilename = filename.replace('.svg', '.js')
            const tsFilename = filename.replace('.svg', '.d.ts')
            const viewBox = getAttributeValue(content, 'viewBox').split(' ')
            const dimensions = `${viewBox[2]} ${viewBox[3]}`

            let iconData = []
            if (dimensions !== '64 64') {
              iconData.push(dimensions)
            }
            const computedContent = content.replace(/(<svg([^>]+)>)|(<\/svg>)/ig, '')
              .replace(/\n/g, '').replace(/"/g, '\'')
              .replace('<!-- Generated by IcoMoon.io -->', '')
            iconData.push(computedContent)

            contents[variableName] = iconData

            // variableName = validate(variableName)
            // jsFilename = validate(jsFilename)
            importName = validate(variableName)

            names.push({
              jsFilename,
              variableName,
              importName
            })

            fs.writeFile(
              `js/${setName}/${jsFilename}`,
              `export const ${importName} = ` + JSON.stringify(iconData),
              () => ''
            )
            fs.writeFile(
              `js/${setName}/${tsFilename}`,
              `export declare const ${importName}: string[];`,
              () => ''
            ) 
          })
        }
      })
      setTimeout(() => {
        fs.writeFile(
          `js/${setName}/${setName}-set.js`,
          `export const ${setName}Set = ` + JSON.stringify(contents),
          () => ''
        )
        fs.writeFile(
          `js/${setName}/${setName}-set.d.ts`,
          typings(names, setName, false),
          () => ''
        )
        fs.writeFile(
          `js/${setName}/index.js`,
          getImports(names, setName),
          () => ''
        )
        fs.writeFile(
          `js/${setName}/index.d.ts`,
          typings(names, setName),
          () => ''
        )
        allNames[setName] = names
      }, 1000)
    })
  })
})

setTimeout(() => {
  let imports = ''
  Object.keys(allNames).forEach(set => {
    imports += getImports(allNames[set], set, true)
    imports += '\n\n\n'
  })
  fs.writeFile(
    `index.js`,
    imports,
    () => ''
  )
}, 3000)
  

// const toPascalCase = function (name) {
//   return name.match(/[A-Za-z0-9]+/gi)
//     .map(function (word) {
//       return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
//     })
//     .join('')
// }

const getAttributeValue = (string, attribute) => {
  const regex = new RegExp(`${attribute}="([^"]+)"`, 'g')
  return string.match(regex, '')[0]
               .match(/"(.*?)"/ig, '')[0]
               .replace(/"/g, '')
}

// function getVariableName (filename, directory) {
//   if (directory.includes('flags')) {
//     return filename.replace('.svg', '').replace(/-/g, '').toUpperCase()
//   } else {
//     return toCamel(filename.replace('.svg', ''))
//   }
// }

function toCamel (str) {
  return str.replace(/([-_][a-z0-9])/ig, ($1) => {
    return $1.toUpperCase().replace('-', '')
  })
}

function validate(str) {
  if (!isNaN(str.charAt(0))) {
    return 'n' + str
  } else {
    return str
  }
}

function getImports(names, setName, deep = false) {
  const folder = deep ? `/js/${setName}/` : '/'
  const defaultImport = `import { ${setName}Set } from '.${folder}${setName}-set.js' \n`
  const defaultExport = `export { ${setName}Set } \n\n`
  const importString = names.map(name => {
    return `import { ${name.importName} } from '.${folder}${name.jsFilename}'`
  }).join('\n')
  const exportString = names.map(name => {
    return `export { ${name.importName} }`
  }).join('\n')
  return defaultImport + defaultExport + importString + '\n' + exportString
}

function typings(names, setName, all = true) {

  const icons = names.map(name => {
    return `  "${name.importName}": string[];`
  }).join('\n')
  const set = `export declare const ${setName}Set: {\n${icons}\n}`

  const exportString = names.map(name => {
    return `export declare const ${name.importName}: string[];`
  }).join('\n')
  
  return all ? set + '\n' + exportString : set
}
