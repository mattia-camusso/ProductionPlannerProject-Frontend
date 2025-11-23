import { useState } from 'react';

/**
 * Reusable TreeView component for hierarchical data display
 * @param {Array} data - Array of root nodes
 * @param {Function} renderNode - Function to render each node (node, level) => JSX
 * @param {Function} getChildren - Function to get children of a node
 * @param {Function} getNodeId - Function to get unique ID for each node
 */
function TreeView({ data, renderNode, getChildren, getNodeId }) {
    const [expanded, setExpanded] = useState({});

    const toggleExpand = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const renderTree = (nodes, level = 0) => {
        if (!nodes || nodes.length === 0) return null;

        return nodes.map(node => {
            const nodeId = getNodeId(node);
            const children = getChildren(node);
            const hasChildren = children && children.length > 0;
            const isExpanded = expanded[nodeId];

            return (
                <div key={nodeId} style={{ width: '100%' }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            paddingLeft: `${level * 24}px`,
                            minHeight: '36px',
                            borderBottom: '1px solid #f0f0f0'
                        }}
                    >
                        {hasChildren ? (
                            <button
                                onClick={() => toggleExpand(nodeId)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    marginRight: '4px',
                                    fontSize: '14px',
                                    color: '#666',
                                    fontFamily: 'monospace'
                                }}
                            >
                                {isExpanded ? '▼' : '▶'}
                            </button>
                        ) : (
                            <span style={{ width: '32px', display: 'inline-block' }} />
                        )}
                        <div style={{ flex: 1 }}>
                            {renderNode(node, level, hasChildren, isExpanded)}
                        </div>
                    </div>
                    {isExpanded && hasChildren && (
                        <div>
                            {renderTree(children, level + 1)}
                        </div>
                    )}
                </div>
            );
        });
    };

    return <div style={{ width: '100%' }}>{renderTree(data)}</div>;
}

export default TreeView;
