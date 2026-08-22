// Maps a city/metro name to the station codes that serve it, so searching "Kolkata"
// surfaces Howrah Jn + Sealdah even though neither station name contains the word "Kolkata".
// Same city can have multiple official IR station codes across different eras/sources
// (e.g. Mumbai Central is both MMCT and BCT) - list every variant seen in the data.
// Extend this as more stations are added.
module.exports = {
  kolkata: ['HWH', 'SDAH', 'SHM', 'KOAA'],
  calcutta: ['HWH', 'SDAH', 'SHM', 'KOAA'],
  delhi: ['NDLS', 'NZM', 'DLI', 'DEE', 'ANDI', 'ANVT'],
  mumbai: ['MMCT', 'CSMT', 'BDTS', 'LTT', 'BCT', 'DR', 'CSTM', 'DDR'],
  bombay: ['MMCT', 'CSMT', 'BDTS', 'BCT', 'DR', 'CSTM', 'DDR'],
  bangalore: ['SBC', 'YPR', 'BNC'],
  bengaluru: ['SBC', 'YPR', 'BNC'],
  hyderabad: ['SC', 'HYB'],
  secunderabad: ['SC', 'HYB'],
  chennai: ['MAS', 'MSB', 'MS'],
  madras: ['MAS', 'MSB', 'MS'],
};
