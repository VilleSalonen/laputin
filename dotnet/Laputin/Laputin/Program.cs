// See https://aka.ms/new-console-template for more information
using Laputin;

var pathSource = @"tempfile.mp4";

var hasher = new Md5Hasher();
var fileInfo = new FileInfo(pathSource);
var stringResult = hasher.Hash(pathSource, fileInfo);

Console.WriteLine($"{pathSource} = {stringResult}");
