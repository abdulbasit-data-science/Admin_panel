"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
} from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";

// Change this to your actual table name
const TABLE_NAME = "price_list";

export default function Home() {
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState<any | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newRow, setNewRow] = useState<any>({});

  // Fetch columns and rows
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch one row to get columns
      const { data: sample, error: sampleError } = await supabase
        .from(TABLE_NAME)
        .select("*")
        .limit(1);
      if (sampleError) {
        setLoading(false);
        return;
      }
      if (sample && sample.length > 0) {
        setColumns(Object.keys(sample[0]));
      } else {
        // fallback: fetch table columns from information_schema
        const { data: cols } = await supabase.rpc("get_table_columns", { table_name: TABLE_NAME });
        if (cols && cols.length > 0) setColumns(cols.map((c: any) => c.column_name));
      }
      // Fetch all rows
      const { data: allRows } = await supabase.from(TABLE_NAME).select("*");
      setRows(allRows || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Add/Edit helpers
  const handleInputChange = (e: any, row: any, setRow: any) => {
    setRow({ ...row, [e.target.name]: e.target.value });
  };

  // Add row
  const handleAdd = async () => {
    await supabase.from(TABLE_NAME).insert([newRow]);
    setAddDialogOpen(false);
    setNewRow({});
    // Refresh
    const { data: allRows } = await supabase.from(TABLE_NAME).select("*");
    setRows(allRows || []);
  };

  // Edit row
  const handleEdit = async () => {
    if (!editRow) return;
    const { id, ...rest } = editRow;
    await supabase.from(TABLE_NAME).update(rest).eq("id", id);
    setEditRow(null);
    // Refresh
    const { data: allRows } = await supabase.from(TABLE_NAME).select("*");
    setRows(allRows || []);
  };

  // Delete row
  const handleDelete = async (id: any) => {
    await supabase.from(TABLE_NAME).delete().eq("id", id);
    // Refresh
    const { data: allRows } = await supabase.from(TABLE_NAME).select("*");
    setRows(allRows || []);
  };

  if (loading) return <CircularProgress />;

  return (
    <div style={{ padding: 32 }}>
      <h1>Supabase Sheet (CRUD Table)</h1>
      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={() => setAddDialogOpen(true)}
        style={{ marginBottom: 16 }}
      >
        Add Row
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col}>{col}</TableCell>
              ))}
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                {columns.map((col) => (
                  <TableCell key={col}>{row[col]}</TableCell>
                ))}
                <TableCell>
                  <IconButton onClick={() => setEditRow(row)}><Edit /></IconButton>
                  <IconButton onClick={() => handleDelete(row.id)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle>Add Row</DialogTitle>
        <DialogContent>
          {columns.map((col) => (
            col === "id" ? null : (
              <TextField
                key={col}
                margin="dense"
                label={col}
                name={col}
                fullWidth
                value={newRow[col] || ""}
                onChange={(e) => handleInputChange(e, newRow, setNewRow)}
              />
            )
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAdd} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editRow} onClose={() => setEditRow(null)}>
        <DialogTitle>Edit Row</DialogTitle>
        <DialogContent>
          {columns.map((col) => (
            col === "id" ? null : (
              <TextField
                key={col}
                margin="dense"
                label={col}
                name={col}
                fullWidth
                value={editRow?.[col] || ""}
                onChange={(e) => handleInputChange(e, editRow, setEditRow)}
              />
            )
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditRow(null)}>Cancel</Button>
          <Button onClick={handleEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
