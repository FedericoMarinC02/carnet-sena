<?php
/*
 * SimpleXLSX v1.0 (trimmed) by Sergey Shuchkin, MIT License.
 * Minimal subset: read first sheet, iterate rows.
 */
class SimpleXLSX
{
    public array $sheets = [];
    private $workbook;

    public static function parse($filename)
    {
        $xlsx = new self();
        if ($xlsx->load($filename)) return $xlsx;
        return false;
    }

    public function load($filename): bool
    {
        if (!class_exists('ZipArchive')) {
            $this->error = 'Zip extension not enabled';
            return false;
        }
        $zip = new ZipArchive();
        if ($zip->open($filename) !== true) {
            $this->error = 'Cannot open ' . $filename;
            return false;
        }
        $this->workbook = [];
        // shared strings
        $strings = [];
        if (($idx = $zip->locateName('xl/sharedStrings.xml')) !== false) {
            $xml = simplexml_load_string($zip->getFromIndex($idx));
            foreach ($xml->si as $si) {
                $strings[] = (string)($si->t ?? '');
            }
        }
        // styles - only numFmts for now
        $styles = [];
        if (($idx = $zip->locateName('xl/styles.xml')) !== false) {
            $xml = simplexml_load_string($zip->getFromIndex($idx));
            $numFmts = [];
            if (isset($xml->numFmts->numFmt)) {
                foreach ($xml->numFmts->numFmt as $f) {
                    $numFmts[(int)$f['numFmtId']] = (string)$f['formatCode'];
                }
            }
            if (isset($xml->cellXfs->xf)) {
                foreach ($xml->cellXfs->xf as $xf) {
                    $styles[] = $numFmts[(int)$xf['numFmtId']] ?? null;
                }
            }
        }
        // workbook relationships
        $sheetRels = [];
        if (($idx = $zip->locateName('xl/_rels/workbook.xml.rels')) !== false) {
            $xml = simplexml_load_string($zip->getFromIndex($idx));
            foreach ($xml->Relationship as $rel) {
                $sheetRels[(string)$rel['Id']] = (string)$rel['Target'];
            }
        }
        // workbook
        $workbook = simplexml_load_string($zip->getFromName('xl/workbook.xml'));
        foreach ($workbook->sheets->sheet as $sheet) {
            $rid = (string)$sheet['r:id'];
            $path = 'xl/' . $sheetRels[$rid];
            $this->sheets[] = [
                'name' => (string)$sheet['name'],
                'path' => $path
            ];
        }
        // parse each sheet lazily now
        foreach ($this->sheets as &$sheet) {
            $sheetXml = simplexml_load_string($zip->getFromName($sheet['path']));
            $rows = [];
            foreach ($sheetXml->sheetData->row as $row) {
                $r = [];
                foreach ($row->c as $c) {
                    $type = (string)$c['t'];
                    $s = (int)$c['s'];
                    $value = $c->v !== null ? (string)$c->v : '';
                    if ($type === 's') {
                        $value = $strings[(int)$value] ?? '';
                    }
                    $r[] = $value;
                }
                $rows[] = $r;
            }
            $sheet['rows'] = $rows;
        }
        $zip->close();
        return true;
    }

    public function rows($index = 0): array
    {
        return $this->sheets[$index]['rows'] ?? [];
    }

    public function sheetName($index = 0): ?string
    {
        return $this->sheets[$index]['name'] ?? null;
    }

    public string $error = '';
}
?>
