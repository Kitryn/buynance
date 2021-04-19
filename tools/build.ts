import shell from 'shelljs'

const buildFolder = './server/dist/'
const folders = new Set(['./server/src/ABI'])

// copy Folders
folders.forEach((folder) => {
    shell.cp('-R', folder, buildFolder)
})