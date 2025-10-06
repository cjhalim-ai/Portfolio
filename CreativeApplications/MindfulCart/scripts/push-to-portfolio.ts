import { getUncachableGitHubClient } from '../server/github-client';
import fs from 'fs';
import path from 'path';

async function getAllFiles(dir: string, fileList: string[] = [], baseDir: string = dir): Promise<string[]> {
  const files = fs.readdirSync(dir);
  
  const excludeDirs = ['node_modules', '.git', 'dist', '.cache', 'build', '.replit', '.upm', '.config'];
  const excludeFiles = ['.gitignore', '.replit', 'replit.nix', '.gitattributes'];
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const relativePath = path.relative(baseDir, filePath);
    
    if (excludeDirs.some(exc => relativePath.startsWith(exc))) {
      continue;
    }
    
    if (excludeFiles.includes(file)) {
      continue;
    }
    
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList, baseDir);
    } else {
      fileList.push(relativePath);
    }
  }
  
  return fileList;
}

async function pushToPortfolio() {
  try {
    const octokit = await getUncachableGitHubClient();
    
    // Get authenticated user
    const { data: user } = await octokit.rest.users.getAuthenticated();
    console.log(`Authenticated as: ${user.login}`);
    
    const owner = 'cjhalim-ai';
    const repo = 'Portfolio';
    const targetPath = 'CreativeApplications/MindfulCart';
    
    // First, delete the mindfulcart repository
    try {
      await octokit.rest.repos.delete({
        owner: user.login,
        repo: 'mindfulcart',
      });
      console.log('✓ Deleted separate mindfulcart repository');
    } catch (error: any) {
      if (error.status !== 404) {
        console.log('Note: Could not delete mindfulcart repo:', error.message);
      }
    }
    
    // Get the default branch
    const { data: repoData } = await octokit.rest.repos.get({
      owner,
      repo,
    });
    const defaultBranch = repoData.default_branch;
    
    // Get all files to upload
    const files = await getAllFiles('/home/runner/workspace');
    console.log(`Found ${files.length} files to upload`);
    
    // Get the latest commit SHA
    const { data: refData } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${defaultBranch}`,
    });
    const latestCommitSha = refData.object.sha;
    
    // Get the tree of the latest commit
    const { data: commitData } = await octokit.rest.git.getCommit({
      owner,
      repo,
      commit_sha: latestCommitSha,
    });
    const baseTreeSha = commitData.tree.sha;
    
    // Create blobs for all files
    const tree: Array<{
      path: string;
      mode: '100644';
      type: 'blob';
      sha: string;
    }> = [];
    for (const file of files) {
      const filePath = path.join('/home/runner/workspace', file);
      const content = fs.readFileSync(filePath);
      
      const { data: blob } = await octokit.rest.git.createBlob({
        owner,
        repo,
        content: content.toString('base64'),
        encoding: 'base64',
      });
      
      tree.push({
        path: `${targetPath}/${file}`,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blob.sha,
      });
      
      if (tree.length % 10 === 0) {
        console.log(`Processed ${tree.length}/${files.length} files...`);
      }
    }
    
    console.log('Creating git tree...');
    const { data: newTree } = await octokit.rest.git.createTree({
      owner,
      repo,
      base_tree: baseTreeSha,
      tree,
    });
    
    console.log('Creating commit...');
    const { data: newCommit } = await octokit.rest.git.createCommit({
      owner,
      repo,
      message: 'Add MindfulCart application to CreativeApplications folder',
      tree: newTree.sha,
      parents: [latestCommitSha],
    });
    
    console.log('Updating reference...');
    await octokit.rest.git.updateRef({
      owner,
      repo,
      ref: `heads/${defaultBranch}`,
      sha: newCommit.sha,
    });
    
    console.log('\n✓ Successfully pushed MindfulCart to Portfolio repository!');
    console.log(`View it at: https://github.com/${owner}/${repo}/tree/${defaultBranch}/${targetPath}`);
    
  } catch (error) {
    console.error('Error pushing to Portfolio:', error);
    throw error;
  }
}

pushToPortfolio();
