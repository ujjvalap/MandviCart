import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Download, FileText, Search, User } from 'lucide-react';

const ActivityLogs = () => {
    const { axios } = useAppContext();
    const [logs, setLogs] = useState([]);
    const [search, setSearch] = useState("");

    const fetchLogs = async () => {
        try {
            const { data } = await axios.get('/api/user/super/logs');
            if (data.success) setLogs(data.logs);
        } catch (error) { console.error("Logs error"); }
    };

    const downloadLogs = () => {
        const headers = ["Timestamp,Actor,Role,Action,Target,Details\n"];
        const rows = logs.map(l => `${new Date(l.timestamp).toISOString()},${l.actorName},${l.role},${l.action},${l.target},"${JSON.stringify(l.details).replace(/"/g, "'")}"`);
        const csvContent = "data:text/csv;charset=utf-8," + headers + rows.join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `activity_logs_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    useEffect(() => { fetchLogs(); }, []);

    const filteredLogs = logs.filter(l => 
        l.action.toLowerCase().includes(search.toLowerCase()) || 
        l.actorName.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800">Audit Logs</h1>
                <button onClick={downloadLogs} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition shadow-sm">
                    <Download size={18}/> Export CSV
                </button>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="relative mb-6">
                    <Search className="absolute top-3.5 left-4 text-slate-400" size={20}/>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by Action, User, or Target..." className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-50 transition-all bg-slate-50 focus:bg-white" />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs tracking-wider">
                            <tr>
                                <th className="p-4 rounded-l-xl">Timestamp</th>
                                <th className="p-4">Actor</th>
                                <th className="p-4">Action</th>
                                <th className="p-4">Target</th>
                                <th className="p-4 rounded-r-xl">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredLogs.map((log) => (
                                <tr key={log._id} className="hover:bg-slate-50/80 transition group">
                                    <td className="p-4 text-slate-400 font-mono text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"><User size={12}/></div>
                                            <span className="font-bold text-slate-700">{log.actorName}</span>
                                        </div>
                                    </td>
                                    <td className="p-4"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-100">{log.action}</span></td>
                                    <td className="p-4 text-slate-600 font-medium">{log.target}</td>
                                    <td className="p-4 text-xs text-slate-400 font-mono max-w-[200px] truncate" title={JSON.stringify(log.details)}>{JSON.stringify(log.details)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
export default ActivityLogs;