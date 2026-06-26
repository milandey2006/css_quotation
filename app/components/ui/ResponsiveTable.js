import Card from './Card';
import { cn } from '../../lib/cn';

/**
 * Renders `columns`/`rows` as a real <table> on md+ screens, and a stacked card list on mobile.
 * Each column can carry a `mobile` role hint (title | subtitle | meta | highlight | badge |
 * actions | hidden) telling the mobile card how to lay it out; `hidden` columns still show in
 * the desktop table but are omitted from the mobile card. `mobileRender`, if given, overrides
 * `render` just for the mobile card (e.g. a page can show a trimmed-down action set on mobile).
 */
export default function ResponsiveTable({ columns, rows, rowKey, loading, emptyState, colSpan }) {
  const span = colSpan || columns.length;

  if (loading) {
    return (
      <>
        <DesktopTable columns={columns}>
          <tr>
            <td colSpan={span} className="px-6 py-8 text-center text-slate-500">Loading...</td>
          </tr>
        </DesktopTable>
        <div className="md:hidden p-8 text-center text-slate-500 text-sm">Loading...</div>
      </>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <>
        <DesktopTable columns={columns}>
          <tr>
            <td colSpan={span} className="px-6 py-8 text-center text-slate-500">{emptyState || 'No records found.'}</td>
          </tr>
        </DesktopTable>
        <div className="md:hidden p-8 text-center text-slate-500 text-sm">{emptyState || 'No records found.'}</div>
      </>
    );
  }

  return (
    <>
      <DesktopTable columns={columns}>
        {rows.map((row) => (
          <tr key={rowKey(row)} className="hover:bg-slate-50/50 transition-colors group">
            {columns.map((col) => (
              <td key={col.key} className="px-6 py-4">
                {col.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </DesktopTable>

      <div className="md:hidden space-y-3">
        {rows.map((row) => (
          <MobileRowCard key={rowKey(row)} row={row} columns={columns} />
        ))}
      </div>
    </>
  );
}

function DesktopTable({ columns, children }) {
  return (
    <div className="hidden md:block w-full overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead className="bg-slate-50/50">
          <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {columns.map((col) => (
              <th key={col.key} className={cn('px-6 py-4', col.align === 'right' && 'text-right')}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

function MobileRowCard({ row, columns }) {
  const visible = columns.filter((col) => col.mobile !== 'hidden');
  const get = (role) => visible.filter((col) => col.mobile === role);
  const renderCol = (col) => (col.mobileRender ? col.mobileRender(row) : col.render(row));

  const titleCols = get('title');
  const subtitleCols = get('subtitle');
  const metaCols = get('meta');
  const highlightCols = get('highlight');
  const badgeCols = get('badge');
  const actionCols = get('actions');
  const plainCols = visible.filter((col) => !col.mobile || col.mobile === 'plain');

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {titleCols.map((col) => (
            <div key={col.key} className="font-semibold text-slate-800 truncate">{renderCol(col)}</div>
          ))}
          {subtitleCols.map((col) => (
            <div key={col.key} className="text-sm text-slate-500 truncate">{renderCol(col)}</div>
          ))}
        </div>
        {badgeCols.map((col) => (
          <div key={col.key} className="flex-shrink-0">{renderCol(col)}</div>
        ))}
      </div>

      {(metaCols.length > 0 || plainCols.length > 0) && (
        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500">
          {metaCols.map((col) => <div key={col.key}>{renderCol(col)}</div>)}
          {plainCols.map((col) => <div key={col.key}>{renderCol(col)}</div>)}
        </div>
      )}

      {highlightCols.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-4">
          {highlightCols.map((col) => (
            <div key={col.key}>
              <div className="text-[10px] uppercase tracking-wide text-slate-400">{col.label}</div>
              <div className="font-bold text-slate-800">{renderCol(col)}</div>
            </div>
          ))}
        </div>
      )}

      {actionCols.length > 0 && (
        <div className="flex flex-wrap items-center justify-end gap-1 mt-3 pt-3 border-t border-slate-100">
          {actionCols.map((col) => <div key={col.key}>{renderCol(col)}</div>)}
        </div>
      )}
    </Card>
  );
}
