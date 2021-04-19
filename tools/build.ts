import shell from 'shelljs'

const buildFolder = './dist/server/'
const folders = new Set(['./src/server/ABI'])

// copy Folders
folders.forEach((folder) => {
    shell.cp('-R', folder, buildFolder)
})