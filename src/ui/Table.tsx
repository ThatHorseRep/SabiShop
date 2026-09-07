import {
  type ReactNode,
  type ThHTMLAttributes,
  type TdHTMLAttributes,
} from 'react'

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="ui-table-wrap">
      <table className="ui-table">{children}</table>
    </div>
  )
}

export function TableHead({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>
}

export function TableRow({ children }: { children: ReactNode }) {
  return <tr>{children}</tr>
}

type HeaderCellProps = {
  numeric?: boolean
  children: ReactNode
} & Omit<ThHTMLAttributes<HTMLTableCellElement>, 'children'>

export function TableHeaderCell({
  numeric,
  children,
  ...rest
}: HeaderCellProps) {
  return (
    <th scope="col" className={numeric ? 'numeric' : undefined} {...rest}>
      {children}
    </th>
  )
}

type CellProps = {
  numeric?: boolean
  mono?: boolean
  children: ReactNode
} & Omit<TdHTMLAttributes<HTMLTableCellElement>, 'children'>

export function TableCell({ numeric, mono, children, ...rest }: CellProps) {
  const classes = [numeric ? 'numeric' : '', mono ? 'mono' : '']
    .filter(Boolean)
    .join(' ')
  return (
    <td className={classes || undefined} {...rest}>
      {children}
    </td>
  )
}

export type TableColumn<Row> = {
  key: string
  header: string
  numeric?: boolean
  mono?: boolean
  render: (row: Row) => ReactNode
  width?: string
}

type DataTableProps<Row> = {
  columns: ReadonlyArray<TableColumn<Row>>
  rows: readonly Row[]
  rowKey: (row: Row) => string
  caption?: string
  empty?: ReactNode
}

/**
 * Management table with consistent alignment and controlled states.
 * Numeric columns align right with tabular figures; dates and IDs stay
 * visually subordinate (C03 section 21).
 */
export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  caption,
  empty,
}: DataTableProps<Row>) {
  return (
    <Table>
      {caption && <caption className="ui-text-caption">{caption}</caption>}
      <TableHead>
        <TableRow>
          {columns.map((column) => (
            <TableHeaderCell
              key={column.key}
              numeric={column.numeric}
              style={column.width ? { width: column.width } : undefined}
            >
              {column.header}
            </TableHeaderCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0
          ? empty
          : rows.map((row) => (
              <TableRow key={rowKey(row)}>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    numeric={column.numeric}
                    mono={column.mono}
                  >
                    {column.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
      </TableBody>
    </Table>
  )
}
