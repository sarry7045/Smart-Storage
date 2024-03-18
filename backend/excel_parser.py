import xlrd
import six
from six.moves import xrange
xlrd.xlsx.ensure_elementtree_imported(False, None)
xlrd.xlsx.Element_has_iter = True


def extract(filename, encoding='utf8'):
    workbook = xlrd.open_workbook(filename)
    sheets_name = workbook.sheet_names()
    output = "\n"
    for names in sheets_name:
        worksheet = workbook.sheet_by_name(names)
        num_rows = worksheet.nrows
        num_cells = worksheet.ncols

        for curr_row in range(num_rows):
            row = worksheet.row(curr_row)
            new_output = []
            for index_col in xrange(num_cells):
                value = worksheet.cell_value(curr_row, index_col)
                if value:
                    if isinstance(value, (int, float)):
                        value = six.text_type(value)
                    new_output.append(value)
            if new_output:
                output += u' '.join(new_output) + u'\n'
    return output.encode(encoding, 'ignore')
