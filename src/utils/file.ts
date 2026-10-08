import SparkMD5 from 'spark-md5'

export async function calculateFileMD5(file: File): Promise<string> {
  return SparkMD5.ArrayBuffer.hash(await file.arrayBuffer())
}
